"use client";
import { useState, useRef, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { uploadFile } from "@/lib/0g-storage";
import { NOTARY_ABI, getContractAddress, type NotaryRecord } from "@/lib/notary";
import { CertCard } from "./CertCard";
import styles from "./NotarizeTab.module.css";

type Phase =
  | { name: "idle" }
  | { name: "uploading"; filename: string }
  | { name: "ready"; filename: string; rootHash: string }
  | { name: "notarizing"; filename: string; rootHash: string }
  | { name: "confirming"; filename: string; rootHash: string; txHash: `0x${string}` }
  | { name: "done"; rootHash: string; txHash: `0x${string}`; record: NotaryRecord }
  | { name: "error"; message: string };

export function NotarizeTab() {
  const { isConnected, address } = useAccount();
  const contractAddress = getContractAddress();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [label, setLabel] = useState("");
  const [txError, setTxError] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();

  // Always call the hook; only enabled when we have a txHash
  const txHash = phase.name === "confirming" ? phase.txHash : undefined;
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  // Transition confirming → done once the tx is mined
  useEffect(() => {
    if (txConfirmed && phase.name === "confirming") {
      const record: NotaryRecord = {
        notarizer: address as `0x${string}`,
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        filename: phase.filename,
        label: label.trim(),
      };
      setPhase({ name: "done", rootHash: phase.rootHash, txHash: phase.txHash, record });
    }
  }, [txConfirmed]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFile = async (file: File) => {
    setPhase({ name: "uploading", filename: file.name });
    try {
      const { rootHash } = await uploadFile(file);
      setPhase({ name: "ready", filename: file.name, rootHash });
    } catch (err) {
      setPhase({ name: "error", message: err instanceof Error ? err.message : "Upload failed" });
    }
  };

  const handleNotarize = async () => {
    if (phase.name !== "ready") return;
    const { rootHash, filename } = phase;
    setTxError(null);
    setPhase({ name: "notarizing", filename, rootHash });
    try {
      const hash = await writeContractAsync({
        address: contractAddress!,
        abi: NOTARY_ABI,
        functionName: "notarize",
        args: [rootHash, filename, label.trim()],
      });
      setPhase({ name: "confirming", filename, rootHash, txHash: hash });
    } catch (err) {
      // Return to ready so user still has their uploaded file
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setTxError(msg);
      setPhase({ name: "ready", filename, rootHash });
    }
  };

  const reset = () => {
    setPhase({ name: "idle" });
    setLabel("");
    setTxError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ---- Walls ---- */

  if (!isConnected) {
    return (
      <div className={styles.wall}>
        <div className={styles.wallIcon}>🔐</div>
        <p className={styles.wallText}>Connect your wallet to notarize documents.</p>
        <p className={styles.wallSub}>
          Your wallet signs the on-chain record — giving you the cryptographic receipt.
        </p>
      </div>
    );
  }

  if (!contractAddress) {
    return (
      <div className={styles.wall}>
        <div className={styles.wallIcon}>⚙️</div>
        <p className={styles.wallText}>Contract not deployed yet.</p>
        <p className={styles.wallSub}>
          Run <code>npm run deploy</code> from the <code>contracts</code> package to deploy the
          Notary contract and auto-populate <code>NEXT_PUBLIC_CONTRACT_ADDRESS</code>.
        </p>
      </div>
    );
  }

  /* ---- Done ---- */

  if (phase.name === "done") {
    return (
      <div className={styles.section}>
        <CertCard rootHash={phase.rootHash} record={phase.record} txHash={phase.txHash} />
        <button className={styles.resetBtn} onClick={reset}>
          Notarize another document
        </button>
      </div>
    );
  }

  /* ---- Main flow ---- */

  return (
    <div className={styles.section}>
      <StepBar phase={phase.name} />

      {/* Drop zone */}
      {(phase.name === "idle" || phase.name === "uploading" || phase.name === "error") && (
        <>
          <div
            className={`${styles.dropzone} ${phase.name === "uploading" ? styles.over : ""}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f && phase.name === "idle") handleFile(f);
            }}
            onClick={() => phase.name === "idle" && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <span className={styles.dropIcon}>↑</span>
            <p>Drop a file or <span className={styles.link}>click to browse</span></p>
            <p className={styles.dropSub}>Any file type · Stored permanently on 0G</p>
          </div>

          {phase.name === "uploading" && (
            <div className={`${styles.status} ${styles.inProgress}`}>
              <span className={styles.spinner} />
              Uploading {phase.filename} to 0G decentralized storage…
            </div>
          )}
          {phase.name === "error" && (
            <div className={`${styles.status} ${styles.errorStatus}`}>
              <span>{phase.message}</span>
              <button className={styles.retryBtn} onClick={() => setPhase({ name: "idle" })}>
                Try again
              </button>
            </div>
          )}
        </>
      )}

      {/* Label + notarize panel */}
      {phase.name === "ready" && (
        <div className={styles.notarizePanel}>
          <div className={styles.uploadedFile}>
            <span className={styles.fileIcon}>📄</span>
            <div className={styles.fileInfo}>
              <p className={styles.fileName}>{phase.filename}</p>
              <p className={styles.rootHashPreview}>{phase.rootHash.slice(0, 22)}…</p>
            </div>
            <button className={styles.changeBtn} onClick={reset}>Change</button>
          </div>

          <label className={styles.labelField}>
            <span className={styles.labelText}>
              Description <span className={styles.optional}>(optional)</span>
            </span>
            <input
              className={styles.input}
              type="text"
              placeholder='e.g. "Signed contract v2 — Q1 2026"'
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={200}
            />
          </label>

          {txError && (
            <div className={`${styles.status} ${styles.errorStatus}`}>
              {txError}
            </div>
          )}

          <button className={styles.notarizeBtn} onClick={handleNotarize}>
            Notarize on Chain
          </button>
          <p className={styles.gasNote}>
            This opens your wallet to sign a transaction. A small gas fee applies.
          </p>
        </div>
      )}

      {/* In-flight tx */}
      {(phase.name === "notarizing" || phase.name === "confirming") && (
        <div className={styles.confirmingBox}>
          <span className={styles.spinner} />
          {phase.name === "notarizing"
            ? "Waiting for wallet confirmation…"
            : "Transaction submitted — waiting for block confirmation…"}
          {phase.name === "confirming" && (
            <a
              className={styles.txLink}
              href={`https://chainscan-galileo.0g.ai/tx/${phase.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {phase.txHash.slice(0, 14)}… ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StepBar({ phase }: { phase: Phase["name"] }) {
  const steps = ["Upload", "Store on 0G", "Record on-chain", "Certificate"];
  const idx =
    phase === "idle" || phase === "error" ? 0
    : phase === "uploading" ? 1
    : phase === "ready" ? 2
    : phase === "notarizing" || phase === "confirming" ? 3
    : 4;

  return (
    <div className={styles.stepBar}>
      {steps.map((s, i) => (
        <div key={s} className={styles.stepWrapper}>
          <div className={`${styles.step} ${i < idx ? styles.stepDone : ""} ${i === idx ? styles.stepActive : ""}`}>
            <span className={styles.stepDot}>{i < idx ? "✓" : i + 1}</span>
            <span className={styles.stepLabel}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <span className={`${styles.stepLine} ${i < idx ? styles.stepLineDone : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}
