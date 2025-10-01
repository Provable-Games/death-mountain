import { useStarknetApi } from "@/api/starknet";
import { useGameTokens } from "@/dojo/useGameTokens";
import { useSystemCalls } from "@/dojo/useSystemCalls";
import { useGameStore } from "@/stores/gameStore";
import { useUIStore } from "@/stores/uiStore";
import { Payment } from "@/types/game";
import { useAnalytics } from "@/utils/analytics";
import { ChainId, NETWORKS } from "@/utils/networkConfig";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { Account, RpcProvider } from "starknet";
import { useDynamicConnector } from "./starknet";
import { delay } from "@/utils/utils";

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
  showTermsOfService: boolean;
  acceptTermsOfService: () => void;
  openBuyTicket: () => void;
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
  const { createBurnerAccount, getTokenBalances, goldenPassReady } =
    useStarknetApi();
  const { getGameTokens } = useGameTokens();
  const { skipIntroOutro } = useUIStore();
  const [burner, setBurner] = useState<Account | null>(null);
  const [userName, setUserName] = useState<string>();
  const [creatingBurner, setCreatingBurner] = useState(false);
  const [tokenBalances, setTokenBalances] = useState({});
  const [goldenPassIds, setGoldenPassIds] = useState<number[]>([]);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const { identifyAddress } = useAnalytics();

  const demoRpcProvider = useMemo(
    () => new RpcProvider({ nodeUrl: NETWORKS.WP_PG_SLOT.rpcUrl }),
    []
  );

  useEffect(() => {
    if (account) {
      fetchTokenBalances();
      identifyAddress({ address: account.address });

      // Check if terms have been accepted
      const termsAccepted = typeof window !== 'undefined'
        ? localStorage.getItem('termsOfServiceAccepted')
        : null;

      if (!termsAccepted) {
        setShowTermsOfService(true);
      }
    }
  }, [account]);

  useEffect(() => {
    if (
      localStorage.getItem("burner") &&
      localStorage.getItem("burner_version") === "6"
    ) {
      let burner = JSON.parse(localStorage.getItem("burner") as string);
      setBurner(
        new Account({
          provider: demoRpcProvider,
          address: burner.address,
          signer: burner.privateKey,
        })
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
    let gameId = await buyGame(
      account,
      payment,
      userName || "Adventurer",
      txs,
      () => {
        navigate(`/survivor/play?mode=entering`);
      }
    );

    if (gameId) {
      await delay(2000);
      navigate(`/survivor/play?id=${gameId}`, { replace: true });
      fetchTokenBalances();
      if (!skipIntroOutro) {
        setShowOverlay(false);
      }
    } else {
      navigate(`/`, { replace: true });
    }
  };

  const createBurner = async () => {
    setCreatingBurner(true);
    let account = await createBurnerAccount(demoRpcProvider);

    if (account) {
      setBurner(account);
    }
    setCreatingBurner(false);
  };

  async function fetchTokenBalances() {
    let balances = await getTokenBalances(
      NETWORKS[import.meta.env.VITE_PUBLIC_CHAIN as keyof typeof NETWORKS]
        .paymentTokens
    );
    setTokenBalances(balances);

    let goldenTokenAddress =
      NETWORKS[import.meta.env.VITE_PUBLIC_CHAIN as keyof typeof NETWORKS]
        .goldenToken;
    const allTokens = await getGameTokens(address!, goldenTokenAddress);
    if (allTokens.length > 0) {
      const cooldowns = await goldenPassReady(goldenTokenAddress, allTokens);
      setGoldenPassIds(cooldowns);
    }
  }

  const acceptTermsOfService = () => {
    setShowTermsOfService(false);
  };

  return (
    <ControllerContext.Provider
      value={{
        account:
          currentNetworkConfig.chainId === ChainId.WP_PG_SLOT
            ? burner
            : account,
        address:
          currentNetworkConfig.chainId === ChainId.WP_PG_SLOT
            ? burner?.address
            : address,
        playerName: userName || "Adventurer",
        isPending: isConnecting || isPending || creatingBurner,
        tokenBalances,
        goldenPassIds,
        showTermsOfService,
        acceptTermsOfService,

        openProfile: () => (connector as any)?.controller?.openProfile(),
        openBuyTicket: () => (connector as any)?.controller?.openStarterPack("ls2-dungeon-ticket-mainnet"),
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
