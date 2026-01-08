import { useQuery } from "@tanstack/react-query";
import { GAUGE_ACCOUNT_ADDRESS } from "@/constants";
import { aptosClient } from "@/utils/aptosClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CommittedPositions } from "@/components/gauge/CommittedPositions";
import { PoolToken } from "@/components/gauge/types";

type GaugePoolProps = {
  poolAddress: string;
  poolKey: string;
  tokens: PoolToken[];
  onCopy: (value: string) => void;
  onUncommit: (poolAddress: string, positionAddress: string) => void;
  onClaimReward: (poolAddress: string, positionAddress: string) => void;
  onOpenBribe: (poolAddress: string, poolKey: string) => void;
  shorten: (value: string) => string;
  isSubmitting: boolean;
  isWalletReady: boolean;
};

export function GaugePool({
  poolAddress,
  poolKey,
  tokens,
  onCopy,
  onUncommit,
  onClaimReward,
  onOpenBribe,
  shorten,
  isSubmitting,
  isWalletReady,
}: GaugePoolProps) {
  return (
    <Card className="border-muted-foreground shadow-sm">
      <CardContent className="flex flex-col gap-2">
        <h3 className="flex items-center gap-2">
          <b>Pool: </b>
          <code
            className="border border-input rounded px-2 py-1"
            onClick={() => onCopy(poolAddress)}
          >
            {shorten(poolAddress)}
          </code>
          <Button
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={!isWalletReady || isSubmitting}
            onClick={() => onOpenBribe(poolAddress, poolKey)}
          >
            Add Bribe
          </Button>
        </h3>

        <RewardPerToken poolAddress={poolAddress} />

        <h3><b>Committed Positions</b></h3>
        <div className="flex flex-wrap items-center gap-2"></div>
        {tokens.length === 0 ? (
          <p className="text-muted-foreground">No positions for this pool.</p>
        ) : (
          <CommittedPositions
            tokens={tokens}
            poolAddress={poolAddress}
            onCopy={onCopy}
            onUncommit={onUncommit}
            onClaimReward={onClaimReward}
            shorten={shorten}
            isSubmitting={isSubmitting}
            isWalletReady={isWalletReady}
          />
        )}
      </CardContent>
    </Card>
  );
}

type RewardPerTokenProps = {
  poolAddress: string;
};

function RewardPerToken({ poolAddress }: RewardPerTokenProps) {
  const { data, isFetching } = useQuery({
    queryKey: ["gauge-reward-per-token", poolAddress],
    enabled: Boolean(GAUGE_ACCOUNT_ADDRESS),
    queryFn: async (): Promise<string | number | bigint> => {
      const result = await aptosClient().view<[string | number | bigint]>({
        payload: {
          function: `${GAUGE_ACCOUNT_ADDRESS}::gauge::reward_per_token`,
          functionArguments: [poolAddress],
        },
      });
      return result[0];
    },
  });

  return (
    <span>
      Reward per LP token: {isFetching ? "Loading..." : `${data ?? 0}`}
    </span>
  );
}
