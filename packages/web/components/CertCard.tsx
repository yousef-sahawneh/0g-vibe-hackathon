"use client";
import { useState } from "react";
import { downloadFile } from "@/lib/0g-storage";
import { formatTimestamp, shortHash, type NotaryRecord } from "@/lib/notary";
import styles from "./CertCard.module.css";

type Props = {
  rootHash: string;
  record: NotaryRecord;
  txHash?: string;
};

export function CertCard({ rootHash, record, txHash }: Props) {
  const [copied, setCopied] = useState<"hash" | "link" | null>(null);
  const [downloading, setDownloading] = useState(false);

  const copy = (text: string, which: "hash" | "link") => {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1800);
  };

  const download = async () => {
    setDownloading(true);
    try {
      await downloadFile(rootHash, record.filename || rootHash);
    } finally {
      setDownloading(false);
    }
  };

  const verifyUrl = typeof window !== "undefined"
    ? `${window.location.origin}?verify=${encodeURIComponent(rootHash)}`
    : "";

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.badge}>✓ Notarized</span>
        <span className={styles.chain}>0G Galileo Testnet</span>
      </div>

      <div className={styles.body}>
        {record.label && (
          <div className={styles.label}>"{record.label}"</div>
        )}

        <div className={styles.rows}>
          {record.filename && (
            <Row label="Document" value={record.filename} />
          )}
          <Row
            label="Notarized by"
            value={`${record.notarizer.slice(0, 8)}…${record.notarizer.slice(-6)}`}
            mono
          />
          <Row
            label="Timestamp"
            value={formatTimestamp(record.timestamp)}
          />
        </div>

        <div className={styles.hashRow}>
          <span className={styles.hashLabel}>Root Hash</span>
          <span className={styles.hashValue}>{shortHash(rootHash, 14)}</span>
          <button
            className={styles.copyBtn}
            onClick={() => copy(rootHash, "hash")}
            title="Copy full root hash"
          >
            {copied === "hash" ? "✓" : "copy"}
          </button>
        </div>
      </div>

      <div className={styles.actions}>
        {txHash && (
          <a
            className={styles.actionLink}
            href={`https://chainscan-galileo.0g.ai/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer ↗
          </a>
        )}
        <button
          className={styles.actionBtn}
          onClick={() => copy(verifyUrl, "link")}
        >
          {copied === "link" ? "✓ Copied!" : "Share Verify Link"}
        </button>
        <button
          className={styles.actionBtn}
          onClick={download}
          disabled={downloading}
        >
          {downloading ? "Downloading…" : "Download"}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={`${styles.rowValue} ${mono ? styles.mono : ""}`}>{value}</span>
    </div>
  );
}
