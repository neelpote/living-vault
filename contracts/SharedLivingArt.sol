// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

interface IF1ArtOracle {
    struct Team { string constructorId; string name; uint24 color; }
    struct Result { uint16 titles; uint16 lastTitle; uint32 pointsMilli; uint16 wins; uint16 position; }
    function revision() external view returns (uint256);
    function sourceHash() external view returns (bytes32);
    function season() external view returns (uint16);
    function round() external view returns (uint16);
    function teamCount() external view returns (uint256);
    function teamInfo(uint256 id) external view returns (Team memory, Result memory);
}

contract SharedLivingArt is ERC721Enumerable {
    using Strings for uint256;
    uint256 public constant MAX_PIECES = 36;
    address public immutable artist;
    IF1ArtOracle public immutable oracle;
    uint64 public mintedMask;
    mapping(uint256 => uint8) public expression;
    uint256 public oracleRevision;
    bytes32 public sourceHash;
    uint16 public season;
    uint16 public round;
    uint256 public totalPointsMilli;
    uint256 public totalWins;
    uint256 public compositionRevision = 1;
    uint8 public activePreset;
    uint256 public proposalCount;
    uint256 public openProposal;
    uint256 public pendingProposal;
    struct Proposal {
        string[3] names;
        uint8[3] presets;
        uint256[3] votes;
        uint64 eligibleMask;
        uint64 deadline;
        bool finalized;
        uint8 winner;
        uint256 afterOracleRevision;
        uint256 appliedRevision;
    }
    mapping(uint256 => Proposal) private _proposals;
    mapping(uint256 => mapping(uint256 => bool)) public hasVoted;
    event PieceClaimed(uint256 indexed tokenId, address indexed owner);
    event ExpressionChanged(uint256 indexed tokenId, uint8 expression);
    event ChapterProposed(uint256 indexed proposalId, uint64 deadline, uint64 eligibleMask);
    event VoteCast(uint256 indexed proposalId, uint256 indexed tokenId, uint8 option);
    event ChapterSelected(uint256 indexed proposalId, uint8 option, uint256 afterOracleRevision);
    event ChapterApplied(uint256 indexed proposalId, uint8 preset, uint256 oracleRevision);
    event CompositionUpdated(uint256 indexed revision, bytes32 sourceHash, uint256 oracleRevision);
    event MetadataUpdate(uint256 tokenId);
    event BatchMetadataUpdate(uint256 fromTokenId, uint256 toTokenId);
    error InvalidInput();
    error NotArtist();
    error NotHolder();
    error ClosedVote();
    error AlreadyVoted();
    error ChapterInProgress();
    error NoNewReport();

    constructor(address oracle_) ERC721("Living Vault Together", "LVT") {
        if (oracle_.code.length == 0) revert InvalidInput();
        artist = msg.sender;
        oracle = IF1ArtOracle(oracle_);
        _readOracle();
    }

    function claim(uint256 cell) external returns (uint256 tokenId) {
        if (cell >= MAX_PIECES || mintedMask & (uint64(1) << uint64(cell)) != 0) revert InvalidInput();
        tokenId = cell + 1;
        mintedMask |= uint64(1) << uint64(cell);
        ++compositionRevision;
        _safeMint(msg.sender, tokenId);
        emit PieceClaimed(tokenId, msg.sender);
        _notify();
    }

    function setExpression(uint256 tokenId, uint8 value) external {
        if (ownerOf(tokenId) != msg.sender) revert NotHolder();
        if (value > 2 || value == expression[tokenId]) revert InvalidInput();
        expression[tokenId] = value;
        ++compositionRevision;
        emit ExpressionChanged(tokenId, value);
        emit MetadataUpdate(tokenId);
        _notify();
    }

    function propose(string[3] calldata names, uint8[3] calldata presets, uint32 duration) external returns (uint256 id) {
        if (msg.sender != artist) revert NotArtist();
        if (openProposal != 0 || pendingProposal != 0) revert ChapterInProgress();
        if (mintedMask == 0 || duration < 60 || duration > 7 days) revert InvalidInput();
        for (uint256 i; i < 3; ++i) {
            if (presets[i] > 8 || !_safeName(names[i])) revert InvalidInput();
            for (uint256 j; j < i; ++j) if (presets[i] == presets[j] || keccak256(bytes(names[i])) == keccak256(bytes(names[j]))) revert InvalidInput();
        }
        id = ++proposalCount;
        Proposal storage p = _proposals[id];
        p.names = names; p.presets = presets; p.eligibleMask = mintedMask;
        p.deadline = uint64(block.timestamp + duration);
        openProposal = id;
        emit ChapterProposed(id, p.deadline, p.eligibleMask);
    }

    function vote(uint256 id, uint256 tokenId, uint8 option) external {
        Proposal storage p = _proposals[id];
        if (id != openProposal || id == 0 || block.timestamp >= p.deadline) revert ClosedVote();
        if (tokenId == 0 || tokenId > MAX_PIECES || option > 2 || p.eligibleMask & (uint64(1) << uint64(tokenId - 1)) == 0) revert InvalidInput();
        if (ownerOf(tokenId) != msg.sender) revert NotHolder();
        if (hasVoted[id][tokenId]) revert AlreadyVoted();
        hasVoted[id][tokenId] = true;
        ++p.votes[option];
        emit VoteCast(id, tokenId, option);
    }

    function finalize(uint256 id) external {
        Proposal storage p = _proposals[id];
        if (id != openProposal || id == 0 || block.timestamp < p.deadline) revert ClosedVote();
        p.finalized = true;
        openProposal = 0;
        // A tie selects the earliest artist option; zero turnout cannot change art.
        uint8 winner;
        for (uint8 i = 1; i < 3; ++i) if (p.votes[i] > p.votes[winner]) winner = i;
        p.winner = winner;
        if (p.votes[winner] > 0) {
            p.afterOracleRevision = oracle.revision();
            pendingProposal = id;
            emit ChapterSelected(id, winner, p.afterOracleRevision);
        }
    }

    function syncOracle() external {
        uint256 next = oracle.revision();
        if (next <= oracleRevision || oracle.sourceHash() == sourceHash) revert NoNewReport();
        uint256 id = pendingProposal;
        if (id != 0 && next <= _proposals[id].afterOracleRevision) revert NoNewReport();
        _readOracle();
        if (id != 0) {
            Proposal storage p = _proposals[id];
            activePreset = p.presets[p.winner];
            p.appliedRevision = oracleRevision;
            pendingProposal = 0;
            emit ChapterApplied(id, activePreset, oracleRevision);
        }
        ++compositionRevision;
        _notify();
    }

    function proposalInfo(uint256 id) external view returns (Proposal memory) {
        if (id == 0 || id > proposalCount) revert InvalidInput();
        return _proposals[id];
    }

    function _readOracle() private {
        uint256 count = oracle.teamCount();
        if (count == 0 || count > 24 || oracle.revision() == 0 || oracle.sourceHash() == bytes32(0)) revert InvalidInput();
        uint256 points; uint256 wins;
        for (uint256 i; i < count; ++i) { (, IF1ArtOracle.Result memory r) = oracle.teamInfo(i); points += r.pointsMilli; wins += r.wins; }
        oracleRevision = oracle.revision(); sourceHash = oracle.sourceHash();
        season = oracle.season(); round = oracle.round(); totalPointsMilli = points; totalWins = wins;
    }

    function _notify() private {
        emit CompositionUpdated(compositionRevision, sourceHash, oracleRevision);
        emit BatchMetadataUpdate(1, MAX_PIECES);
    }

    function compositionSVG() external view returns (string memory) { return _svg(activePreset, 0); }
    function previewSVG(uint8 preset) external view returns (string memory) {
        if (preset > 8) revert InvalidInput();
        return _svg(preset, 0);
    }
    function pieceSVG(uint256 tokenId) public view returns (string memory) { _requireOwned(tokenId); return _svg(activePreset, tokenId); }

    function _svg(uint8 preset, uint256 tokenId) private view returns (string memory) {
        string memory viewBox = "0 0 720 720";
        if (tokenId > 0) viewBox = string.concat((((tokenId - 1) % 6) * 120).toString(), " ", (((tokenId - 1) / 6) * 120).toString(), " 120 120");
        string memory palette = preset < 3 ? "#ef3a45" : preset < 6 ? "#1bd1b0" : "#b581ff";
        string memory second = preset < 3 ? "#ffcf79" : preset < 6 ? "#c4f977" : "#ff89c7";
        string memory svg = string.concat('<svg xmlns="http://www.w3.org/2000/svg" viewBox="', viewBox, '"><title>Living Together / composition ', compositionRevision.toString(), '</title><defs><linearGradient id="r" x1="0" y1="0" x2="1" y2="1"><stop stop-color="', palette, '"/><stop offset=".5" stop-color="#f1f9ff"/><stop offset="1" stop-color="', second, '"/></linearGradient><linearGradient id="s"><stop stop-color="', second, '"/><stop offset="1" stop-color="', palette, '"/></linearGradient><clipPath id="c"><rect width="120" height="120"/></clipPath></defs><rect width="720" height="720" fill="#101716"/>');
        for (uint256 cell; cell < MAX_PIECES; ++cell) {
            if (tokenId > 0 && tokenId != cell + 1) continue;
            uint256 x = (cell % 6) * 120; uint256 y = (cell / 6) * 120;
            bool claimed = mintedMask & (uint64(1) << uint64(cell)) != 0;
            uint256 strength = claimed ? 11 + uint256(expression[cell + 1]) * 5 : 2;
            uint256 bend = 18 + (totalPointsMilli / 1000 + cell * 7 + totalWins * 3) % 44;
            uint256 rotation = ((uint256(sourceHash) >> (cell * 6)) % 4) * 90;
            svg = string.concat(svg, '<g transform="translate(', x.toString(), ' ', y.toString(), ')" clip-path="url(#c)" opacity="', claimed ? '1' : '.22', '"><g transform="rotate(', rotation.toString(), ' 60 60)" fill="none" stroke-linecap="round">');
            if (preset % 3 == 0) {
                svg = string.concat(svg, '<path d="M-8 60C', bend.toString(), ' -10 ', (120 - bend).toString(), ' 130 128 60" stroke="url(#r)" stroke-width="', strength.toString(), '"/><path d="M-8 89C', bend.toString(), ' 20 ', (120 - bend).toString(), ' 159 128 89" stroke="url(#s)" stroke-width="', (strength / 3 + 1).toString(), '"/>');
            } else if (preset % 3 == 1) {
                svg = string.concat(svg, '<path d="M-8 60L60 ', bend.toString(), ' 128 60M60 -8L', (120 - bend).toString(), ' 60 60 128" stroke="url(#r)" stroke-width="', strength.toString(), '"/><circle cx="60" cy="60" r="', (strength + 8).toString(), '" stroke="url(#s)" stroke-width="3"/>');
            } else {
                svg = string.concat(svg, '<path d="M-8 60H128M60 -8V128" stroke="url(#r)" stroke-width="', (strength / 2 + 1).toString(), '"/><circle cx="60" cy="60" r="', bend.toString(), '" stroke="url(#s)" stroke-width="', strength.toString(), '"/><circle cx="60" cy="60" r="', (bend / 2).toString(), '" stroke="#e8f8ef" stroke-width="2"/>');
            }
            svg = string.concat(svg, '</g></g>');
        }
        return string.concat(svg, '</svg>');
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string.concat("data:application/json;base64,", Base64.encode(abi.encodePacked('{"name":"Living Together / Fragment ', tokenId.toString(), '","description":"One of 36 fragments in a shared on-chain composition. Holder expression and voted chapters respond to the linked trusted F1 oracle. No deposit or yield.","image":"data:image/svg+xml;base64,', Base64.encode(bytes(pieceSVG(tokenId))), '","attributes":[{"trait_type":"Fragment","value":', tokenId.toString(), '},{"trait_type":"Chapter preset","value":', uint256(activePreset).toString(), '},{"trait_type":"Oracle revision","value":', oracleRevision.toString(), '},{"trait_type":"Expression","value":', uint256(expression[tokenId]).toString(), '}]}')));
    }

    function supportsInterface(bytes4 id) public view override returns (bool) { return id == 0x49064906 || super.supportsInterface(id); }
    function _safeName(string memory name_) private pure returns (bool) {
        bytes memory b = bytes(name_); if (b.length == 0 || b.length > 32) return false;
        for (uint256 i; i < b.length; ++i) { uint8 c = uint8(b[i]); if (!(c >= 48 && c <= 57) && !(c >= 65 && c <= 90) && !(c >= 97 && c <= 122) && c != 32 && c != 45) return false; }
        return true;
    }
}
