import { useState, useCallback } from 'react';
import { addAddressPadding } from 'starknet';
import { useDynamicConnector } from '@/contexts/starknet';
import { useDungeon } from '@/dojo/useDungeon';
import { ChainId } from '@/utils/networkConfig';
import { getContractByName } from '@dojoengine/core';
import { hexToAscii } from '@dojoengine/utils';

export interface PlayerSearchResult {
  owner: string;
  player_name: string;
  token_id: string;
}

export function usePlayerSearch() {
  const { currentNetworkConfig } = useDynamicConnector();
  const dungeon = useDungeon();

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const GAME_TOKEN_ADDRESS = getContractByName(
    currentNetworkConfig.manifest,
    currentNetworkConfig.namespace,
    "game_token_systems"
  )?.address;

  const mintedByAddress = currentNetworkConfig.chainId === ChainId.WP_PG_SLOT
    ? GAME_TOKEN_ADDRESS
    : addAddressPadding(dungeon.address);

  const searchPlayers = useCallback(async (searchQuery: string): Promise<PlayerSearchResult[]> => {
    console.log('[PlayerSearch] Starting search for:', searchQuery);

    if (!searchQuery.trim()) {
      console.log('[PlayerSearch] Empty search query, clearing results');
      setResults([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      // Query unique player names with their owners
      // Uses the same table structure as metagame-sdk
      const query = `
        SELECT DISTINCT
          o.owner,
          pn.player_name,
          o.token_id
        FROM "relayer_0_0_1-TokenPlayerNameUpdate" pn
        INNER JOIN "relayer_0_0_1-OwnersUpdate" o ON o.token_id = pn.id
        INNER JOIN "relayer_0_0_1-TokenMetadataUpdate" tm ON tm.id = pn.id
        INNER JOIN "relayer_0_0_1-MinterRegistryUpdate" mr ON mr.id = tm.minted_by
        WHERE mr.minter_address = "${mintedByAddress}"
          AND pn.player_name IS NOT NULL
          AND o.owner IS NOT NULL
        ORDER BY pn.player_name ASC
        LIMIT 200
      `.replace(/\s+/g, ' ').trim();

      console.log('[PlayerSearch] mintedByAddress:', mintedByAddress);
      console.log('[PlayerSearch] toriiUrl:', currentNetworkConfig.toriiUrl);
      console.log('[PlayerSearch] Query:', query);

      const url = `${currentNetworkConfig.toriiUrl}/sql?query=${encodeURIComponent(query)}`;
      console.log('[PlayerSearch] Full URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[PlayerSearch] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[PlayerSearch] Error response body:', errorText);
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[PlayerSearch] Raw data from server:', data);
      console.log('[PlayerSearch] Number of rows returned:', Array.isArray(data) ? data.length : 'not an array');

      // Log first few items for debugging
      if (Array.isArray(data) && data.length > 0) {
        console.log('[PlayerSearch] First 3 items:', data.slice(0, 3));
      }

      // Decode player names and filter by search query
      const searchLower = searchQuery.toLowerCase();
      const decodedResults: PlayerSearchResult[] = [];
      const seenOwners = new Set<string>();

      for (const item of data) {
        if (!item.owner || !item.player_name) {
          console.log('[PlayerSearch] Skipping item with missing data:', item);
          continue;
        }

        // Decode hex player name
        let decodedName = '';
        try {
          decodedName = hexToAscii(item.player_name).replace(/^\0+/, '');
          console.log('[PlayerSearch] Decoded name:', item.player_name, '->', decodedName);
        } catch (decodeErr) {
          console.log('[PlayerSearch] Failed to decode, using raw:', item.player_name, decodeErr);
          decodedName = item.player_name;
        }

        // Skip if doesn't match search
        if (!decodedName.toLowerCase().includes(searchLower)) {
          continue;
        }

        console.log('[PlayerSearch] Match found:', decodedName);

        // Deduplicate by owner
        const normalizedOwner = addAddressPadding(item.owner).toLowerCase();
        if (seenOwners.has(normalizedOwner)) continue;
        seenOwners.add(normalizedOwner);

        decodedResults.push({
          owner: item.owner,
          player_name: decodedName,
          token_id: item.token_id,
        });

        if (decodedResults.length >= 10) break;
      }

      console.log('[PlayerSearch] Final decoded results:', decodedResults);
      setResults(decodedResults);
      return decodedResults;
    } catch (err) {
      console.error('[PlayerSearch] Error searching for players:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentNetworkConfig.toriiUrl, mintedByAddress]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    loading,
    results,
    error,
    searchPlayers,
    clearResults,
  };
}
