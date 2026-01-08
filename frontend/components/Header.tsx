import { WalletSelector } from "./WalletSelector";

export function Header() {
  const commitHash = __COMMIT_HASH__;
  const commitMessage = __COMMIT_MESSAGE__;
  const showCommitInfo = commitHash !== "unknown" && commitMessage !== "unknown";

  return (
    <div className="flex items-center justify-between px-4 py-2 max-w-screen-xl mx-auto w-full flex-wrap">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h1 className="display">ve(3,3) TAPP</h1>
        {showCommitInfo ? (
          <span className="text-xs text-muted-foreground">
            <b>Built commit</b> {commitHash} — {commitMessage}
          </span>
        ) : null}
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <WalletSelector />
      </div>
    </div>
  );
}
