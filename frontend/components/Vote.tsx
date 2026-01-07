import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VETAPP_ACCOUNT_ADDRESS } from "@/constants";
import { aptosClient } from "@/utils/aptosClient";
import { formatNumber8 } from "@/utils/format";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { updatePeriod } from "@/entry-functions/updatePeriod";
import { QuickAccess } from "@/components/QuickAccess";

type EpochView = string | number | bigint;

type EpochData = {
  epochStart: EpochView;
  epochNext: EpochView;
  voteStart: EpochView;
  voteEnd: EpochView;
  activePeriod: EpochView;
  epochCount: EpochView;
  weeklyEmission: EpochView;
};

const toEpochSeconds = (value: EpochView): number | null => {
  const numeric = typeof value === "bigint" ? Number(value) : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const toDisplay = (value: EpochView) => {
  const seconds = toEpochSeconds(value);
  if (seconds === null) {
    return `${value}`;
  }
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return `${value}`;
  }
  return date.toLocaleString();
};

export function Vote() {
  const { account, signAndSubmitTransaction } = useWallet();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminSubmittingKey, setAdminSubmittingKey] = useState<string | null>(null);
  const { data, isFetching, isError } = useQuery({
    queryKey: ["helper-ve-epochs"],
    enabled: Boolean(VETAPP_ACCOUNT_ADDRESS),
    queryFn: async (): Promise<EpochData> => {
      const [epochStart, epochNext, voteStart, voteEnd, activePeriod, epochCount, weeklyEmission] = await Promise.all([
        aptosClient().view<[EpochView]>({
          payload: {
            function: `${VETAPP_ACCOUNT_ADDRESS}::helper_ve::epoch_start`,
          },
        }),
        aptosClient().view<[EpochView]>({
          payload: {
            function: `${VETAPP_ACCOUNT_ADDRESS}::helper_ve::epoch_next`,
          },
        }),
        aptosClient().view<[EpochView]>({
          payload: {
            function: `${VETAPP_ACCOUNT_ADDRESS}::helper_ve::epoch_vote_start`,
          },
        }),
        aptosClient().view<[EpochView]>({
          payload: {
            function: `${VETAPP_ACCOUNT_ADDRESS}::helper_ve::epoch_vote_end`,
          },
        }),
        aptosClient().view<[EpochView]>({
          payload: {
            function: `${VETAPP_ACCOUNT_ADDRESS}::minter::active_period`,
          },
        }),
        aptosClient().view<[EpochView]>({
          payload: {
            function: `${VETAPP_ACCOUNT_ADDRESS}::minter::epoch_count`,
          },
        }),
        aptosClient().view<[EpochView]>({
          payload: {
            function: `${VETAPP_ACCOUNT_ADDRESS}::minter::weekly`,
          },
        }),
      ]);

      return {
        epochStart: epochStart[0],
        epochNext: epochNext[0],
        voteStart: voteStart[0],
        voteEnd: voteEnd[0],
        activePeriod: activePeriod[0],
        epochCount: epochCount[0],
        weeklyEmission: weeklyEmission[0],
      };
    },
  });

  if (!VETAPP_ACCOUNT_ADDRESS) {
    return <div className="text-sm text-muted-foreground">VETAPP address not configured.</div>;
  }

  if (isError) {
    return <div className="text-sm text-destructive">Failed to load vote epochs.</div>;
  }

  const onUpdatePeriod = async () => {
    if (!account || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      const committedTransaction = await signAndSubmitTransaction(updatePeriod());
      const executedTransaction = await aptosClient().waitForTransaction({
        transactionHash: committedTransaction.hash,
      });
      queryClient.invalidateQueries({ queryKey: ["helper-ve-epochs"] });
      toast({
        title: "Success",
        description: `Transaction succeeded, hash: ${executedTransaction.hash}`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update period.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const actions = [
    {
      key: "create-time-and-epoch",
      label: "Create Time + Epoch",
      functionName: "create_time_and_epoch",
    },
    {
      key: "create-pools",
      label: "Create Pools",
      functionName: "create_pools",
    },
    {
      key: "swaps-pools",
      label: "Swaps Pools",
      functionName: "swaps_pools",
    },
    {
      key: "distribute-gauges",
      label: "Distribute Gauges",
      functionName: "distribute_gauges",
    },
  ];

  const runAction = async (functionName: string, key: string) => {
    if (!account || adminSubmittingKey) {
      return;
    }

    try {
      setAdminSubmittingKey(key);
      const committedTransaction = await signAndSubmitTransaction({
        data: {
          function: `${VETAPP_ACCOUNT_ADDRESS}::helper_ve::${functionName}`,
          functionArguments: [],
        },
      });
      const executedTransaction = await aptosClient().waitForTransaction({
        transactionHash: committedTransaction.hash,
      });
      toast({
        title: "Success",
        description: `Transaction succeeded, hash: ${executedTransaction.hash}`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to run ${functionName}.`,
      });
    } finally {
      setAdminSubmittingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-lg font-medium">Vote epochs</h4>
      <QuickAccess />
      {isFetching || !data ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid gap-2 text-xs">
          <div>
            Epoch start: {toDisplay(data.epochStart)} · Epoch next: {toDisplay(data.epochNext)}
          </div>
          <div>
            Vote start: {toDisplay(data.voteStart)} · Vote end: {toDisplay(data.voteEnd)}
          </div>
          <div>
            Active period: {toDisplay(data.activePeriod)} · Epoch count: {data.epochCount as number}
            <Button
              className="ml-2 h-7 px-2 text-xs"
              size="sm"
              disabled={!account || isSubmitting}
              onClick={onUpdatePeriod}
            >
              {isSubmitting ? "Updating..." : "Update Period"}
            </Button>
          </div>
          <div>Weekly emission: {formatNumber8(data.weeklyEmission)}</div>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <div className="text-lg font-medium"></div>
        <div className="flex flex-wrap gap-2 text-xs">
          {actions.map((action) => (
            <Button
              key={action.key}
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={!account || Boolean(adminSubmittingKey)}
              onClick={() => runAction(action.functionName, action.key)}
            >
              {adminSubmittingKey === action.key ? "Running..." : action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
