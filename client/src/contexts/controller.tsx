import { useStarknetApi } from "@/api/starknet";
import {
  ChainId,
  NETWORKS
} from "@/utils/networkConfig";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Account, RpcProvider } from "starknet";
import { useDynamicConnector } from "./starknet";
import { useGameTokens } from "@/dojo/useGameTokens";
import { useNavigate } from "react-router-dom";
import { useSystemCalls } from "@/dojo/useSystemCalls";
import { Payment } from "@/types/game";
import { useGameStore } from "@/stores/gameStore";

export interface ControllerContext {
  account: any;
  address: string | undefined;
  playerName: string;
  isPending: boolean;
  tokenBalances: Record<string, string>;
  goldenPassIds: number[];
  openProfile: () => void;
  login: () => void;
  logout: () => void;
  enterDungeon: (payment: Payment, txs: any[]) => void;
}

// Create a context
const ControllerContext = createContext<ControllerContext>(
  {} as ControllerContext
);

// Create a provider component
export const ControllerProvider = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const { setShowOverlay } = useGameStore();
  const { account, address, isConnecting } = useAccount();
  const { buyGame } = useSystemCalls();
  const { connector, connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { currentNetworkConfig } = useDynamicConnector();
  const { createBurnerAccount, getTokenBalances, goldenPassReady } = useStarknetApi();
  const { getGameTokens } = useGameTokens();
  const [burner, setBurner] = useState<Account | null>(null);
  const [userName, setUserName] = useState<string>();
  const [creatingBurner, setCreatingBurner] = useState(false);
  const [tokenBalances, setTokenBalances] = useState({});
  const [goldenPassIds, setGoldenPassIds] = useState<number[]>([]);

  const demoRpcProvider = useMemo(
    () => new RpcProvider({ nodeUrl: NETWORKS.WP_PG_SLOT.rpcUrl }),
    []
  );

  useEffect(() => {
    if (address) {
      fetchTokenBalances();
    }
  }, [address]);

  useEffect(() => {
    if (
      localStorage.getItem("burner") &&
      localStorage.getItem("burner_version") === "3"
    ) {
      let burner = JSON.parse(localStorage.getItem("burner") as string);
      setBurner(
        new Account(demoRpcProvider, burner.address, burner.privateKey)
      );
    } else {
      createBurner();
    }
  }, []);

  // Get username when connector changes
  useEffect(() => {
    const getUsername = async () => {
      try {
        const name = await (connector as any)?.username();
        if (name) setUserName(name);
      } catch (error) {
        console.error("Error getting username:", error);
      }
    };

    if (connector) getUsername();
  }, [connector]);

  const enterDungeon = async (payment: Payment, txs: any[]) => {
    let gameId = await buyGame(account, payment, userName || "Adventurer", txs, () => {
      navigate(`/survivor/play?mode=entering`);
    });

    if (gameId) {
      navigate(`/survivor/play?id=${gameId}`, { replace: true });
      setShowOverlay(false);
      fetchTokenBalances();
    } else {
      navigate(`/`, { replace: true });
    }
  }

  const createBurner = async () => {
    setCreatingBurner(true);
    let account = await createBurnerAccount(demoRpcProvider);

    if (account) {
      setBurner(account);
    }
    setCreatingBurner(false);
  };

  async function fetchTokenBalances() {
    const balances = await getTokenBalances(NETWORKS[import.meta.env.VITE_PUBLIC_CHAIN as keyof typeof NETWORKS].paymentTokens);
    setTokenBalances(balances);

    let goldenTokenAddress = NETWORKS[import.meta.env.VITE_PUBLIC_CHAIN as keyof typeof NETWORKS].goldenToken;
    const allTokens = await getGameTokens(address!, goldenTokenAddress);
    if (allTokens.length > 0) {
      const cooldowns = await goldenPassReady(goldenTokenAddress, allTokens);
      setGoldenPassIds(cooldowns);
    }
  }

  return (
    <ControllerContext.Provider
      value={{
        account:
          currentNetworkConfig.chainId === ChainId.WP_PG_SLOT
            ? burner
            : account,
        address: currentNetworkConfig.chainId === ChainId.WP_PG_SLOT ? burner?.address : address,
        playerName: userName || "Adventurer",
        isPending: isConnecting || isPending || creatingBurner,
        tokenBalances,
        goldenPassIds,

        openProfile: () => (connector as any)?.controller?.openProfile(),
        login: () =>
          connect({
            connector: connectors.find((conn) => conn.id === "controller"),
          }),
        logout: () => disconnect(),
        enterDungeon,
      }}
    >
      {children}
    </ControllerContext.Provider>
  );
};

export const useController = () => {
  const context = useContext(ControllerContext);
  if (!context) {
    throw new Error("useController must be used within a ControllerProvider");
  }
  return context;
};
