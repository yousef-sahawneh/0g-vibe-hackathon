"use client";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { downloadFile } from "@/lib/0g-storage";
import { NOTARY_ABI, getContractAddress, formatTimestamp, shortHash, type NotaryRecord } from "@/lib/notary";
import styles from "./MyDocsTab.module.css";

export function MyDocsTab() {
  const { address, isConnected } = useAccount();
  const contractAddress = getContractAddress();

  // Fetch list of root hashes for connected wallet
  const { data: hashes, isLoading: loadingHashes } = useReadContract({
    address: contractAddress ?? undefined,
    abi: NOTARY_ABI,
    functionName: "getByOwner",
    args: [address!],
    query: { enabled: !!contractAddress && !!address },
  });

  const hashList = (hashes as string[] | undefined) ?? [];

  // Fetch records for each hash
  const { data: recordResults, isLoading: loadingRecords } = useReadContracts({
    contracts: hashList.map((hash) => ({
      address: contractAddress!,
      abi: NOTARY_ABI,
      functionName: "getRecord" as const,
      args: [hash] as [string],
    })),
    query: { enabled: hashList.length > 0 },
  });

  if (!isConnected) {
    return (
      <div className={styles.wall}>
        <div className={styles.wallIcon}>👛</div>
        <p className={styles.wallText}>Connect your wallet to see your notarizations.</p>
        <p className={styles.wallSub}>
          All records are stored on-chain — your wallet address is the key to your history.
        </p>
      </div>
    );
  }

  if (!contractAddress) {
    return (
      <div className={styles.wall}>
        <div className={styles.wallIcon}>⚙️</div>
        <p className={styles.wallText}>Contract not deployed yet.</p>
        <p className={styles.wallSub}>Deploy the Notary contract first.</p>
      </div>
    );
  }

  if (loadingHashes || loadingRecords) {
    return (
      <div className={styles.loading}>
        <span className={styles.spinner} /> Loading your notarizations…
      </div>
    );
  }

  if (hashList.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📂</div>
        <p className={styles.emptyTitle}>No notarizations yet</p>
        <p className={styles.emptySub}>
          Head to the Notarize tab to permanently stamp your first document on-chain.
        </p>
      </div>
    );
  }

  // Combine hashes + records, most-recent first
  const items = hashList
    .map((hash, i) => {
      const result = recordResults?.[i];
      const record = result?.status === "success" ? (result.result as unknown as NotaryRecord) : null;
      return { hash, record };
    })
    .filter((item) => item.record && item.record.timestamp > BigInt(0))
    .reverse();

  return (
    <div className={styles.section}>
      <p className={styles.count}>{items.length} document{items.length !== 1 ? "s" : ""} notarized</p>
      <ul className={styles.list}>
        {items.map(({ hash, record }) => (
          <DocRow key={hash} rootHash={hash} record={record!} />
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function DocRow({ rootHash, record }: { rootHash: string; record: NotaryRecord }) {
  const download = async () => {
    await downloadFile(rootHash, record.filename || rootHash);
  };

  return (
    <li className={styles.row}>
      <div className={styles.rowMain}>
        <div className={styles.rowTop}>
          <span className={styles.filename}>{record.filename || "(unnamed)"}</span>
          <span className={styles.timestamp}>{formatTimestamp(record.timestamp)}</span>
        </div>
        {record.label && <p className={styles.label}>"{record.label}"</p>}
        <div className={styles.rowBottom}>
          <span className={styles.hash} title={rootHash}>{shortHash(rootHash, 12)}</span>
          <a
            className={styles.explorerLink}
            href={`https://chainscan-galileo.0g.ai/address/${record.notarizer}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on chain ↗
          </a>
        </div>
      </div>
      <button className={styles.downloadBtn} onClick={download} title="Download original">
        ↓
      </button>
    </li>
  );
}
