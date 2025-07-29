import { hexToAscii } from "@dojoengine/utils";
import { addAddressPadding } from "starknet";
import { Adventurer, Equipment, Item, Stats } from "@/types/game";
import { useDojoConfig } from "@/contexts/starknet";

export interface Settings {
  settings_id: number;
  name: string;
  created_by: string;
  vrf_address: string;
  adventurer: Adventurer;
  bag: Item[];
  game_seed: number;
  game_seed_until_xp: number;
  in_battle: boolean;
  stats_mode: string;
  base_damage_reduction: number;
}

export const useGameSettings = () => {
  const dojoConfig = useDojoConfig();

  const getRecommendedSettings = async (): Promise<Settings[]> => {
    try {
      // TODO: Replace with dynamic relayer namespace
      let url = `${dojoConfig.toriiUrl}/sql?query=
          SELECT settings_id, COUNT(*) as usage_count
          FROM "relayer_0_0_1-TokenMetadataUpdate"
          GROUP BY settings_id
          ORDER BY usage_count DESC, settings_id ASC
          LIMIT 50`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      // Filter out settings_id 0 if it exists and add it to the beginning
      const filteredData = data.filter((item: any) => item.settings_id !== 0);
      const topSettingsIds = [
        0,
        ...filteredData.map((item: any) => item.settings_id),
      ];

      return await getSettingsList(null, topSettingsIds);
    } catch (error) {
      console.error("Error fetching recommended settings:", error);
      return [];
    }
  };

  const getSettingsList = async (
    address: string | null,
    ids: number[] | null
  ): Promise<Settings[]> => {
    let whereClause: string[] = [];

    if (address) {
      whereClause.push(`metadata.created_by = "${addAddressPadding(address)}"`);
    }

    if (!address && ids && ids.length > 0) {
      const idsFormatted = ids.join(",");
      whereClause.push(`settings.settings_id IN (${idsFormatted})`);
    }

    const whereStatement =
      whereClause.length > 0 ? `WHERE ${whereClause.join(" AND ")}` : "";

    let url = `${dojoConfig.toriiUrl}/sql?query=
        SELECT *
        FROM 
          "${dojoConfig.namespace}-GameSettingsMetadata" as metadata
        JOIN 
          "${dojoConfig.namespace}-GameSettings" as settings
        ON 
          metadata.settings_id = settings.settings_id
        ${whereStatement}
        ORDER BY settings_id ASC
        LIMIT 1000`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      let results: Settings[] = data.map((item: any) => ({
        settings_id: item.settings_id,
        name: hexToAscii(item.name).replace(/^\0+/, ""),
        created_by: item.created_by,
        vrf_address: item.vrf_address || "",
        adventurer: formatAdventurer(item),
        bag: formatBag(item),
        in_battle: item.in_battle,
        game_seed: parseInt(item.game_seed, 16),
        game_seed_until_xp: item.game_seed_until_xp,
        stats_mode: item.stats_mode,
        base_damage_reduction: item.base_damage_reduction || 0,
      }));

      // Sort by the order of input IDs if provided
      if (ids && ids.length > 0) {
        results.sort(
          (a: any, b: any) =>
            ids.indexOf(a.settings_id) - ids.indexOf(b.settings_id)
        );
      }

      return results;
    } catch (error) {
      console.error("Error fetching settings list:", error);
      return [];
    }
  };

  const formatAdventurer = (data: any): Adventurer => {
    let equipment: Equipment = {
      weapon: {
        id: data["adventurer.equipment.weapon.id"],
        xp: data["adventurer.equipment.weapon.xp"],
      },
      chest: {
        id: data["adventurer.equipment.chest.id"],
        xp: data["adventurer.equipment.chest.xp"],
      },
      head: {
        id: data["adventurer.equipment.head.id"],
        xp: data["adventurer.equipment.head.xp"],
      },
      waist: {
        id: data["adventurer.equipment.waist.id"],
        xp: data["adventurer.equipment.waist.xp"],
      },
      foot: {
        id: data["adventurer.equipment.foot.id"],
        xp: data["adventurer.equipment.foot.xp"],
      },
      hand: {
        id: data["adventurer.equipment.hand.id"],
        xp: data["adventurer.equipment.hand.xp"],
      },
      neck: {
        id: data["adventurer.equipment.neck.id"],
        xp: data["adventurer.equipment.neck.xp"],
      },
      ring: {
        id: data["adventurer.equipment.ring.id"],
        xp: data["adventurer.equipment.ring.xp"],
      },
    };

    let stats: Stats = {
      strength: data["adventurer.stats.strength"],
      dexterity: data["adventurer.stats.dexterity"],
      vitality: data["adventurer.stats.vitality"],
      intelligence: data["adventurer.stats.intelligence"],
      wisdom: data["adventurer.stats.wisdom"],
      charisma: data["adventurer.stats.charisma"],
      luck: data["adventurer.stats.luck"],
    };

    const adventurer: Adventurer = {
      health: data["adventurer.health"],
      xp: data["adventurer.xp"],
      gold: data["adventurer.gold"],
      beast_health: data["adventurer.beast_health"],
      stat_upgrades_available: data["adventurer.stat_upgrades_available"],
      stats: stats,
      equipment: equipment,
      item_specials_seed: data["adventurer.item_specials_seed"],
      action_count: data["adventurer.action_count"],
    };

    return adventurer;
  };

  const formatBag = (data: any): Item[] => {
    let bag: Item[] = [];

    for (let bagIndex = 1; bagIndex <= 15; bagIndex++) {
      if (data[`bag.item_${bagIndex}.id`] === 0) continue;

      bag.push({
        id: data[`bag.item_${bagIndex}.id`],
        xp: data[`bag.item_${bagIndex}.xp`],
      });
    }

    return bag;
  };

  return {
    getRecommendedSettings,
    getSettingsList,
    formatAdventurer,
    formatBag,
  };
};
