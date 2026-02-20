// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Notary
/// @notice Immutable on-chain registry of documents stored on 0G decentralized storage.
///         Provides tamper-proof proof-of-existence: a permanent record of who submitted
///         which document (by its 0G root hash) and exactly when.
contract Notary {
    struct Record {
        address notarizer;
        uint256 timestamp;
        string  filename;
        string  label;
    }

    // rootHash => Record
    mapping(string => Record) private _records;
    // notarizer => list of rootHashes they notarized
    mapping(address => string[]) private _byOwner;
    // global ordered list
    string[] private _all;

    event Notarized(
        address indexed notarizer,
        string  rootHash,
        string  filename,
        string  label,
        uint256 timestamp
    );

    /// @notice Notarize a document already uploaded to 0G storage.
    /// @param rootHash  The 0G storage root hash returned by the upload.
    /// @param filename  Original filename (informational).
    /// @param label     Short human-readable description of the document.
    function notarize(
        string calldata rootHash,
        string calldata filename,
        string calldata label
    ) external {
        require(bytes(rootHash).length > 0, "Notary: rootHash required");
        require(_records[rootHash].timestamp == 0, "Notary: already notarized");

        _records[rootHash] = Record({
            notarizer: msg.sender,
            timestamp: block.timestamp,
            filename:  filename,
            label:     label
        });
        _byOwner[msg.sender].push(rootHash);
        _all.push(rootHash);

        emit Notarized(msg.sender, rootHash, filename, label, block.timestamp);
    }

    /// @notice Look up the on-chain record for a given root hash.
    function getRecord(string calldata rootHash)
        external
        view
        returns (Record memory)
    {
        return _records[rootHash];
    }

    /// @notice All root hashes notarized by a given address.
    function getByOwner(address addr) external view returns (string[] memory) {
        return _byOwner[addr];
    }

    /// @notice Total number of documents notarized globally.
    function totalCount() external view returns (uint256) {
        return _all.length;
    }

    /// @notice Paginated access to global list (most recent last).
    function getAll(uint256 offset, uint256 limit)
        external
        view
        returns (string[] memory result)
    {
        uint256 len = _all.length;
        if (offset >= len) return new string[](0);
        uint256 end = offset + limit > len ? len : offset + limit;
        result = new string[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = _all[i];
        }
    }
}
