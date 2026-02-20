"use client";
import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { NOTARY_ABI, getContractAddress, type NotaryRecord } from "@/lib/notary";
import { CertCard } from "./CertCard";
import styles from "./VerifyTab.module.css";

type State =
  | { name: "idle" }
  | { name: "loading" }
  | { name: "found"; rootHash: string; record: NotaryRecord }
  | { name: "not_found"; rootHash: string }
  | { name: "error"; message: string };

export function VerifyTab({ initialHash }: { initialHash?: string }) {
  const contractAddress = getContractAddress();
  const [input, setInput] = useState(initialHash ?? "");
  const [queryHash, setQueryHash] = useState<string | null>(initialHash ?? null);
  const [state, setState] = useState<State>(initialHash ? { name: "loading" } : { name: "idle" });

  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: contractAddress ?? undefined,
    abi: NOTARY_ABI,
    functionName: "getRecord",
    args: [queryHash ?? ""],
    query: { enabled: !!contractAddress && !!queryHash },
  });

  useEffect(() => {
    if (!queryHash) return;
    if (isLoading) { setState({ name: "loading" }); return; }
    if (isError) { setState({ name: "error", message: error?.message ?? "Read failed" }); return; }
    if (data) {
      const record = data as unknown as NotaryRecord;
      if (record.timestamp === BigInt(0) || record.notarizer === "0x0000000000000000000000000000000000000000") {
        setState({ name: "not_found", rootHash: queryHash });
      } else {
        setState({ name: "found", rootHash: queryHash, record });
      }
    }
  }, [data, isLoading, isError, queryHash]); // eslint-disable-line react-hooks/exhaustive-deps

  const verify = () => {
    const h = input.trim();
    if (!h) return;
    setQueryHash(h);
    setState({ name: "loading" });
    refetch();
  };

  if (!contractAddress) {
    return (
      <div className={styles.wall}>
        <div className={styles.wallIcon}>⚙️</div>
        <p className={styles.wallText}>Contract not deployed yet.</p>
        <p className={styles.wallSub}>Deploy the Notary contract first to enable verification.</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.searchBox}>
        <input
          className={styles.input}
          type="text"
          placeholder="Paste a 0G root hash to verify…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && verify()}
        />
        <button
          className={styles.verifyBtn}
          onClick={verify}
          disabled={!input.trim() || state.name === "loading"}
        >
          {state.name === "loading" ? <span className={styles.spinner} /> : "Verify"}
        </button>
      </div>

      {state.name === "idle" && (
        <div className={styles.hint}>
          <p>Enter the root hash returned when a document was notarized.</p>
          <p>The root hash uniquely identifies the file contents — if the document was changed even slightly, the hash would differ.</p>
        </div>
      )}

      {state.name === "loading" && (
        <div className={styles.loading}>
          <span className={styles.spinner} /> Looking up on-chain record…
        </div>
      )}

      {state.name === "found" && (
        <div className={styles.result}>
          <CertCard rootHash={state.rootHash} record={state.record} />
        </div>
      )}

      {state.name === "not_found" && (
        <div className={styles.notFound}>
          <span className={styles.notFoundIcon}>✗</span>
          <div>
            <p className={styles.notFoundTitle}>No record found</p>
            <p className={styles.notFoundSub}>
              This hash has not been notarized on-chain. Either the document wasn't notarized,
              or the hash is incorrect.
            </p>
            <p className={styles.notFoundHash}>{state.rootHash}</p>
          </div>
        </div>
      )}

      {state.name === "error" && (
        <div className={styles.errorBox}>
          {state.message}
          <button className={styles.retryBtn} onClick={verify}>Retry</button>
        </div>
      )}
    </div>
  );
}
