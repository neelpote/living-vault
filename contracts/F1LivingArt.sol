// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

// Custom push oracle: the immutable reporter bridges public Jolpica results.
// Source hashes prove which report was published, not that HTTP data is trustless.
contract F1LivingArt is ERC721Enumerable {
    using Strings for uint256;
    struct Team { string constructorId; string name; uint24 color; }
    struct Result { uint16 titles; uint16 lastTitle; uint32 pointsMilli; uint16 wins; uint16 position; }
    struct Report { uint16 season; uint16 round; uint16 throughSeason; uint64 observedAt; bytes32 sourceHash; Result[] results; }
    address public immutable reporter;
    uint256 public nextTokenId = 1;
    uint256 public revision;
    uint16 public season;
    uint16 public round;
    uint16 public throughSeason;
    uint64 public observedAt;
    bytes32 public sourceHash;
    Team[] private _teams;
    Result[] private _results;
    mapping(uint256 => uint256) public tokenTeam;
    event OraclePublished(uint256 indexed revision, bytes32 indexed sourceHash, uint16 season, uint16 round, uint16 throughSeason, uint64 observedAt);
    event BatchMetadataUpdate(uint256 fromTokenId, uint256 toTokenId);
    event TeamMinted(uint256 indexed tokenId, uint256 indexed teamId, address indexed owner);
    error NotReporter();
    error InvalidReport();
    error InvalidTeam();
    error StaleReport();

    constructor(Team[] memory teams_, Report memory initial) ERC721("Living Vault F1", "LVF1") {
        reporter = msg.sender;
        if (teams_.length == 0 || teams_.length > 24) revert InvalidTeam();
        for (uint256 i; i < teams_.length; ++i) {
            if (!_safeText(teams_[i].constructorId) || !_safeText(teams_[i].name)) revert InvalidTeam();
            for (uint256 j; j < i; ++j) if (keccak256(bytes(teams_[j].constructorId)) == keccak256(bytes(teams_[i].constructorId))) revert InvalidTeam();
            _teams.push(teams_[i]);
        }
        _publish(initial);
    }

    function publish(Report calldata report) external {
        if (msg.sender != reporter) revert NotReporter();
        _publish(report);
        if (nextTokenId > 1) emit BatchMetadataUpdate(1, nextTokenId - 1);
    }

    function _publish(Report memory report) private {
        if (report.results.length != _teams.length || report.season < 1958 || report.season > 2100 || report.throughSeason < 1958 || report.throughSeason > report.season || report.round > 50 || report.sourceHash == bytes32(0) || report.observedAt == 0 || report.observedAt > block.timestamp + 300) revert InvalidReport();
        if (revision > 0 && (report.observedAt <= observedAt || report.season < season || report.throughSeason < throughSeason || (report.season == season && report.round < round) || report.sourceHash == sourceHash)) revert StaleReport();
        delete _results;
        for (uint256 i; i < report.results.length; ++i) {
            Result memory r = report.results[i];
            if (r.titles > 100 || r.wins > 50 || r.position > _teams.length || (r.titles == 0 && r.lastTitle != 0) || (r.titles > 0 && (r.lastTitle < 1958 || r.lastTitle > report.throughSeason))) revert InvalidReport();
            _results.push(r);
        }
        season = report.season; round = report.round; throughSeason = report.throughSeason;
        observedAt = report.observedAt; sourceHash = report.sourceHash; ++revision;
        emit OraclePublished(revision, sourceHash, season, round, throughSeason, observedAt);
    }

    function mint(uint256 teamId) external returns (uint256 tokenId) {
        if (teamId >= _teams.length) revert InvalidTeam();
        tokenId = nextTokenId++; tokenTeam[tokenId] = teamId;
        _safeMint(msg.sender, tokenId);
        emit TeamMinted(tokenId, teamId, msg.sender);
    }

    function teamCount() external view returns (uint256) { return _teams.length; }
    function teamInfo(uint256 teamId) external view returns (Team memory team, Result memory result) {
        if (teamId >= _teams.length) revert InvalidTeam();
        return (_teams[teamId], _results[teamId]);
    }

    function teamSVG(uint256 teamId) public view returns (string memory) {
        if (teamId >= _teams.length) revert InvalidTeam();
        Team memory team = _teams[teamId]; Result memory r = _results[teamId];
        uint256 c = team.color;
        string memory color = string.concat("rgb(", (c >> 16).toString(), ",", ((c >> 8) & 255).toString(), ",", (c & 255).toString(), ")");
        uint256 rings = 2 + (r.titles > 18 ? 6 : uint256(r.titles) / 3);
        uint256 angle = (uint256(r.pointsMilli) / 100 + uint256(r.wins) * 13 + uint256(r.titles) * 7) % 360;
        string memory svg = string.concat('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><title>', team.name, ' / F1 living artwork</title><desc>', uint256(r.titles).toString(), ' Constructors Championships through ', uint256(throughSeason).toString(), '. Oracle revision ', revision.toString(), '.</desc><defs><radialGradient id="g"><stop stop-color="#203338"/><stop offset="1" stop-color="#071211"/></radialGradient><linearGradient id="p" x1="0" y1="0" x2="1" y2=".8"><stop stop-color="#fffaf2"/><stop offset=".2" stop-color="#9bafb2"/><stop offset=".36" stop-color="', color, '"/><stop offset=".53" stop-color="#fcfff8"/><stop offset=".7" stop-color="#263e43"/><stop offset="1" stop-color="', color, '"/></linearGradient><linearGradient id="edge"><stop stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><filter id="shadow" x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="4" dy="7" stdDeviation="4" flood-color="#000" flood-opacity=".65"/></filter></defs><rect width="600" height="600" fill="url(#g)"/><g fill="none" stroke="#b5d6cd" stroke-opacity=".12" stroke-width=".7"><circle cx="300" cy="277" r="240"/><circle cx="300" cy="277" r="232"/><path d="M300 25V529M48 277H552"/></g><g transform="translate(300 277) rotate(', angle.toString(), ')">');
        for (uint256 layer; layer < rings; ++layer) {
            uint256 scale = 100 - layer * 11;
            svg = string.concat(svg, '<g fill="url(#p)" stroke="url(#edge)" stroke-width=".75" filter="url(#shadow)" transform="rotate(', (layer * 31 + uint256(r.wins) * 2).toString(), ') scale(0.', scale == 100 ? '99' : scale.toString(), ')">');
            for (uint256 petal; petal < 12; ++petal) svg = string.concat(svg, '<path d="M0 -211C91 -223 132 -106 42 -33C26 -20 10 -18 0 -19C69 -80 18 -155 0 -211Z" transform="rotate(', (petal * 30).toString(), ')"/>');
            svg = string.concat(svg, '</g>');
        }
        svg = string.concat(svg, '<circle r="18" fill="url(#p)"/><circle r="10" fill="#122728" stroke="', color, '" stroke-width="2"/><circle r="3" fill="#fff8df"/><circle r="222" fill="none" stroke="', color, '" stroke-opacity=".7" stroke-dasharray="2 8"/></g><g fill="#f5eedd" font-family="Georgia,serif" text-anchor="middle"><text x="300" y="526" font-size="27">', team.name, '</text><text x="300" y="557" font-size="16">', uint256(r.titles).toString(), ' CONSTRUCTORS TITLES</text><text x="300" y="579" font-size="10">', uint256(season).toString(), ' / ROUND ', uint256(round).toString(), ' / ', (uint256(r.pointsMilli) / 1000).toString(), ' POINTS</text></g></svg>');
        return svg;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint256 teamId = tokenTeam[tokenId]; Result memory r = _results[teamId];
        bytes memory json = abi.encodePacked('{"name":"Living F1 / ', _teams[teamId].name, ' / No. ', tokenId.toString(), '","description":"On-chain F1 artwork driven by a single-reporter Jolpica sports oracle. No deposit or financial value promised.","image":"data:image/svg+xml;base64,', Base64.encode(bytes(teamSVG(teamId))), '","attributes":[{"trait_type":"Constructor titles","value":', uint256(r.titles).toString(), '},{"trait_type":"Season","value":', uint256(season).toString(), '},{"trait_type":"Round","value":', uint256(round).toString(), '},{"trait_type":"Oracle revision","value":', revision.toString(), '}]}');
        return string.concat("data:application/json;base64,", Base64.encode(json));
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) { return interfaceId == 0x49064906 || super.supportsInterface(interfaceId); }
    function _safeText(string memory text) private pure returns (bool) {
        bytes memory b = bytes(text); if (b.length == 0 || b.length > 64) return false;
        for (uint256 i; i < b.length; ++i) { uint8 c = uint8(b[i]); if (!(c >= 48 && c <= 57) && !(c >= 65 && c <= 90) && !(c >= 97 && c <= 122) && c != 32 && c != 45 && c != 95) return false; }
        return true;
    }
}
