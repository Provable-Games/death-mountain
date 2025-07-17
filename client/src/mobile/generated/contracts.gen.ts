import { DojoCall, DojoProvider } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoCustomEnum, CairoOption } from "starknet";
import type { ItemPurchase } from './models.gen';
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const build_adventurer_systems_addItemToBag_calldata = (bag: models.Bag, item: models.Item): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "add_item_to_bag",
			calldata: [bag, item],
		};
	};

	const adventurer_systems_addItemToBag = async (bag: models.Bag, item: models.Item) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_addItemToBag_calldata(bag, item));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_addNewItemToBag_calldata = (bag: models.Bag, itemId: BigNumberish): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "add_new_item_to_bag",
			calldata: [bag, itemId],
		};
	};

	const adventurer_systems_addNewItemToBag = async (bag: models.Bag, itemId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_addNewItemToBag_calldata(bag, itemId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_bagContains_calldata = (bag: models.Bag, itemId: BigNumberish): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "bag_contains",
			calldata: [bag, itemId],
		};
	};

	const adventurer_systems_bagContains = async (bag: models.Bag, itemId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_bagContains_calldata(bag, itemId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_generateStartingStats_calldata = (seed: BigNumberish): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "generate_starting_stats",
			calldata: [seed],
		};
	};

	const adventurer_systems_generateStartingStats = async (seed: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_generateStartingStats_calldata(seed));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_getAdventurer_calldata = (adventurerId: BigNumberish): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "get_adventurer",
			calldata: [adventurerId],
		};
	};

	const adventurer_systems_getAdventurer = async (adventurerId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_getAdventurer_calldata(adventurerId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_getAdventurerName_calldata = (adventurerId: BigNumberish): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "get_adventurer_name",
			calldata: [adventurerId],
		};
	};

	const adventurer_systems_getAdventurerName = async (adventurerId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_getAdventurerName_calldata(adventurerId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_getBag_calldata = (adventurerId: BigNumberish): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "get_bag",
			calldata: [adventurerId],
		};
	};

	const adventurer_systems_getBag = async (adventurerId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_getBag_calldata(adventurerId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_getBagItem_calldata = (bag: models.Bag, itemId: BigNumberish): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "get_bag_item",
			calldata: [bag, itemId],
		};
	};

	const adventurer_systems_getBagItem = async (bag: models.Bag, itemId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_getBagItem_calldata(bag, itemId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_getBattleRandomness_calldata = (xp: BigNumberish, actionCount: BigNumberish, seed: BigNumberish): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "get_battle_randomness",
			calldata: [xp, actionCount, seed],
		};
	};

	const adventurer_systems_getBattleRandomness = async (xp: BigNumberish, actionCount: BigNumberish, seed: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_getBattleRandomness_calldata(xp, actionCount, seed));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_getDiscovery_calldata = (adventurerLevel: BigNumberish, discoveryTypeRnd: BigNumberish, amountRnd1: BigNumberish, amountRnd2: BigNumberish): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "get_discovery",
			calldata: [adventurerLevel, discoveryTypeRnd, amountRnd1, amountRnd2],
		};
	};

	const adventurer_systems_getDiscovery = async (adventurerLevel: BigNumberish, discoveryTypeRnd: BigNumberish, amountRnd1: BigNumberish, amountRnd2: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_getDiscovery_calldata(adventurerLevel, discoveryTypeRnd, amountRnd1, amountRnd2));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_getMarket_calldata = (seed: BigNumberish): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "get_market",
			calldata: [seed],
		};
	};

	const adventurer_systems_getMarket = async (seed: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_getMarket_calldata(seed));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_getRandomness_calldata = (adventurerXp: BigNumberish, seed: BigNumberish): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "get_randomness",
			calldata: [adventurerXp, seed],
		};
	};

	const adventurer_systems_getRandomness = async (adventurerXp: BigNumberish, seed: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_getRandomness_calldata(adventurerXp, seed));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_isBagFull_calldata = (bag: models.Bag): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "is_bag_full",
			calldata: [bag],
		};
	};

	const adventurer_systems_isBagFull = async (bag: models.Bag) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_isBagFull_calldata(bag));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_loadAssets_calldata = (adventurerId: BigNumberish): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "load_assets",
			calldata: [adventurerId],
		};
	};

	const adventurer_systems_loadAssets = async (adventurerId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_loadAssets_calldata(adventurerId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_packAdventurer_calldata = (adventurer: models.Adventurer): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "pack_adventurer",
			calldata: [adventurer],
		};
	};

	const adventurer_systems_packAdventurer = async (adventurer: models.Adventurer) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_packAdventurer_calldata(adventurer));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_packBag_calldata = (bag: models.Bag): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "pack_bag",
			calldata: [bag],
		};
	};

	const adventurer_systems_packBag = async (bag: models.Bag) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_packBag_calldata(bag));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_removeItemFromBag_calldata = (bag: models.Bag, itemId: BigNumberish): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "remove_item_from_bag",
			calldata: [bag, itemId],
		};
	};

	const adventurer_systems_removeItemFromBag = async (bag: models.Bag, itemId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_removeItemFromBag_calldata(bag, itemId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_adventurer_systems_removeStatBoosts_calldata = (adventurer: models.Adventurer, bag: models.Bag): DojoCall => {
		return {
			contractName: "adventurer_systems",
			entrypoint: "remove_stat_boosts",
			calldata: [adventurer, bag],
		};
	};

	const adventurer_systems_removeStatBoosts = async (adventurer: models.Adventurer, bag: models.Bag) => {
		try {
			return await provider.call("ls_0_0_1", build_adventurer_systems_removeStatBoosts_calldata(adventurer, bag));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_beast_systems_attemptFlee_calldata = (adventurerLevel: BigNumberish, adventurerDexterity: BigNumberish, rnd: BigNumberish): DojoCall => {
		return {
			contractName: "beast_systems",
			entrypoint: "attempt_flee",
			calldata: [adventurerLevel, adventurerDexterity, rnd],
		};
	};

	const beast_systems_attemptFlee = async (adventurerLevel: BigNumberish, adventurerDexterity: BigNumberish, rnd: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_beast_systems_attemptFlee_calldata(adventurerLevel, adventurerDexterity, rnd));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_beast_systems_getBeast_calldata = (adventurerLevel: BigNumberish, weaponType: CairoCustomEnum, seed: BigNumberish, healthRnd: BigNumberish, levelRnd: BigNumberish, special2Rnd: BigNumberish, special3Rnd: BigNumberish): DojoCall => {
		return {
			contractName: "beast_systems",
			entrypoint: "get_beast",
			calldata: [adventurerLevel, weaponType, seed, healthRnd, levelRnd, special2Rnd, special3Rnd],
		};
	};

	const beast_systems_getBeast = async (adventurerLevel: BigNumberish, weaponType: CairoCustomEnum, seed: BigNumberish, healthRnd: BigNumberish, levelRnd: BigNumberish, special2Rnd: BigNumberish, special3Rnd: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_beast_systems_getBeast_calldata(adventurerLevel, weaponType, seed, healthRnd, levelRnd, special2Rnd, special3Rnd));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_beast_systems_getCriticalHitChance_calldata = (adventurerLevel: BigNumberish, isAmbush: boolean): DojoCall => {
		return {
			contractName: "beast_systems",
			entrypoint: "get_critical_hit_chance",
			calldata: [adventurerLevel, isAmbush],
		};
	};

	const beast_systems_getCriticalHitChance = async (adventurerLevel: BigNumberish, isAmbush: boolean) => {
		try {
			return await provider.call("ls_0_0_1", build_beast_systems_getCriticalHitChance_calldata(adventurerLevel, isAmbush));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_beast_systems_getStarterBeast_calldata = (starterWeaponType: CairoCustomEnum, seed: BigNumberish): DojoCall => {
		return {
			contractName: "beast_systems",
			entrypoint: "get_starter_beast",
			calldata: [starterWeaponType, seed],
		};
	};

	const beast_systems_getStarterBeast = async (starterWeaponType: CairoCustomEnum, seed: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_beast_systems_getStarterBeast_calldata(starterWeaponType, seed));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_systems_attack_calldata = (adventurerId: BigNumberish, toTheDeath: boolean): DojoCall => {
		return {
			contractName: "game_systems",
			entrypoint: "attack",
			calldata: [adventurerId, toTheDeath],
		};
	};

	const game_systems_attack = async (snAccount: Account | AccountInterface, adventurerId: BigNumberish, toTheDeath: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_systems_attack_calldata(adventurerId, toTheDeath),
				"ls_0_0_1",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_systems_buyItems_calldata = (adventurerId: BigNumberish, potions: BigNumberish, items: Array<ItemPurchase>): DojoCall => {
		return {
			contractName: "game_systems",
			entrypoint: "buy_items",
			calldata: [adventurerId, potions, items],
		};
	};

	const game_systems_buyItems = async (snAccount: Account | AccountInterface, adventurerId: BigNumberish, potions: BigNumberish, items: Array<ItemPurchase>) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_systems_buyItems_calldata(adventurerId, potions, items),
				"ls_0_0_1",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_systems_drop_calldata = (adventurerId: BigNumberish, items: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "game_systems",
			entrypoint: "drop",
			calldata: [adventurerId, items],
		};
	};

	const game_systems_drop = async (snAccount: Account | AccountInterface, adventurerId: BigNumberish, items: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_systems_drop_calldata(adventurerId, items),
				"ls_0_0_1",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_systems_equip_calldata = (adventurerId: BigNumberish, items: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "game_systems",
			entrypoint: "equip",
			calldata: [adventurerId, items],
		};
	};

	const game_systems_equip = async (snAccount: Account | AccountInterface, adventurerId: BigNumberish, items: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_systems_equip_calldata(adventurerId, items),
				"ls_0_0_1",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_systems_explore_calldata = (adventurerId: BigNumberish, tillBeast: boolean): DojoCall => {
		return {
			contractName: "game_systems",
			entrypoint: "explore",
			calldata: [adventurerId, tillBeast],
		};
	};

	const game_systems_explore = async (snAccount: Account | AccountInterface, adventurerId: BigNumberish, tillBeast: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_systems_explore_calldata(adventurerId, tillBeast),
				"ls_0_0_1",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_systems_flee_calldata = (adventurerId: BigNumberish, toTheDeath: boolean): DojoCall => {
		return {
			contractName: "game_systems",
			entrypoint: "flee",
			calldata: [adventurerId, toTheDeath],
		};
	};

	const game_systems_flee = async (snAccount: Account | AccountInterface, adventurerId: BigNumberish, toTheDeath: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_systems_flee_calldata(adventurerId, toTheDeath),
				"ls_0_0_1",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_systems_selectStatUpgrades_calldata = (adventurerId: BigNumberish, statUpgrades: models.Stats): DojoCall => {
		return {
			contractName: "game_systems",
			entrypoint: "select_stat_upgrades",
			calldata: [adventurerId, statUpgrades],
		};
	};

	const game_systems_selectStatUpgrades = async (snAccount: Account | AccountInterface, adventurerId: BigNumberish, statUpgrades: models.Stats) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_systems_selectStatUpgrades_calldata(adventurerId, statUpgrades),
				"ls_0_0_1",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_systems_startGame_calldata = (adventurerId: BigNumberish, weapon: BigNumberish): DojoCall => {
		return {
			contractName: "game_systems",
			entrypoint: "start_game",
			calldata: [adventurerId, weapon],
		};
	};

	const game_systems_startGame = async (snAccount: Account | AccountInterface, adventurerId: BigNumberish, weapon: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_systems_startGame_calldata(adventurerId, weapon),
				"ls_0_0_1",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_approve_calldata = (to: string, tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "approve",
			calldata: [to, tokenId],
		};
	};

	const game_token_systems_approve = async (snAccount: Account | AccountInterface, to: string, tokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_token_systems_approve_calldata(to, tokenId),
				"ls_0_0_1",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_balanceOf_calldata = (account: string): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "balanceOf",
			calldata: [account],
		};
	};

	const game_token_systems_balanceOf = async (account: string) => {
		try {
			return await provider.call("ls_0_0_1", build_game_token_systems_balanceOf_calldata(account));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_emitMetadataUpdate_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "emit_metadata_update",
			calldata: [gameId],
		};
	};

	const game_token_systems_emitMetadataUpdate = async (snAccount: Account | AccountInterface, gameId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_token_systems_emitMetadataUpdate_calldata(gameId),
				"ls_0_0_1",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_gameCount_calldata = (): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "game_count",
			calldata: [],
		};
	};

	const game_token_systems_gameCount = async () => {
		try {
			return await provider.call("ls_0_0_1", build_game_token_systems_gameCount_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_gameMetadata_calldata = (): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "game_metadata",
			calldata: [],
		};
	};

	const game_token_systems_gameMetadata = async () => {
		try {
			return await provider.call("ls_0_0_1", build_game_token_systems_gameMetadata_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_getApproved_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "getApproved",
			calldata: [tokenId],
		};
	};

	const game_token_systems_getApproved = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_game_token_systems_getApproved_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_isApprovedForAll_calldata = (owner: string, operator: string): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "isApprovedForAll",
			calldata: [owner, operator],
		};
	};

	const game_token_systems_isApprovedForAll = async (owner: string, operator: string) => {
		try {
			return await provider.call("ls_0_0_1", build_game_token_systems_isApprovedForAll_calldata(owner, operator));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_mint_calldata = (playerName: BigNumberish, settingsId: BigNumberish, start: CairoOption<BigNumberish>, end: CairoOption<BigNumberish>, to: string): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "mint",
			calldata: [playerName, settingsId, start, end, to],
		};
	};

	const game_token_systems_mint = async (snAccount: Account | AccountInterface, playerName: BigNumberish, settingsId: BigNumberish, start: CairoOption<BigNumberish>, end: CairoOption<BigNumberish>, to: string) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_token_systems_mint_calldata(playerName, settingsId, start, end, to),
				"ls_0_0_1",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_name_calldata = (): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "name",
			calldata: [],
		};
	};

	const game_token_systems_name = async () => {
		try {
			return await provider.call("ls_0_0_1", build_game_token_systems_name_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_ownerOf_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "ownerOf",
			calldata: [tokenId],
		};
	};

	const game_token_systems_ownerOf = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_game_token_systems_ownerOf_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_safeTransferFrom_calldata = (from: string, to: string, tokenId: BigNumberish, data: Array<BigNumberish>): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "safeTransferFrom",
			calldata: [from, to, tokenId, data],
		};
	};

	const game_token_systems_safeTransferFrom = async (snAccount: Account | AccountInterface, from: string, to: string, tokenId: BigNumberish, data: Array<BigNumberish>) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_token_systems_safeTransferFrom_calldata(from, to, tokenId, data),
				"ls_0_0_1",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_score_calldata = (gameId: BigNumberish): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "score",
			calldata: [gameId],
		};
	};

	const game_token_systems_score = async (gameId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_game_token_systems_score_calldata(gameId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_scoreAttribute_calldata = (): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "score_attribute",
			calldata: [],
		};
	};

	const game_token_systems_scoreAttribute = async () => {
		try {
			return await provider.call("ls_0_0_1", build_game_token_systems_scoreAttribute_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_scoreModel_calldata = (): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "score_model",
			calldata: [],
		};
	};

	const game_token_systems_scoreModel = async () => {
		try {
			return await provider.call("ls_0_0_1", build_game_token_systems_scoreModel_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_setApprovalForAll_calldata = (operator: string, approved: boolean): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "setApprovalForAll",
			calldata: [operator, approved],
		};
	};

	const game_token_systems_setApprovalForAll = async (snAccount: Account | AccountInterface, operator: string, approved: boolean) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_token_systems_setApprovalForAll_calldata(operator, approved),
				"ls_0_0_1",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_settingExists_calldata = (settingsId: BigNumberish): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "setting_exists",
			calldata: [settingsId],
		};
	};

	const game_token_systems_settingExists = async (settingsId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_game_token_systems_settingExists_calldata(settingsId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_settingsModel_calldata = (): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "settings_model",
			calldata: [],
		};
	};

	const game_token_systems_settingsModel = async () => {
		try {
			return await provider.call("ls_0_0_1", build_game_token_systems_settingsModel_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_supportsInterface_calldata = (interfaceId: BigNumberish): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "supports_interface",
			calldata: [interfaceId],
		};
	};

	const game_token_systems_supportsInterface = async (interfaceId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_game_token_systems_supportsInterface_calldata(interfaceId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_symbol_calldata = (): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "symbol",
			calldata: [],
		};
	};

	const game_token_systems_symbol = async () => {
		try {
			return await provider.call("ls_0_0_1", build_game_token_systems_symbol_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_tokenMetadata_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "token_metadata",
			calldata: [tokenId],
		};
	};

	const game_token_systems_tokenMetadata = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_game_token_systems_tokenMetadata_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_tokenUri_calldata = (tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "token_uri",
			calldata: [tokenId],
		};
	};

	const game_token_systems_tokenUri = async (tokenId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_game_token_systems_tokenUri_calldata(tokenId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_game_token_systems_transferFrom_calldata = (from: string, to: string, tokenId: BigNumberish): DojoCall => {
		return {
			contractName: "game_token_systems",
			entrypoint: "transferFrom",
			calldata: [from, to, tokenId],
		};
	};

	const game_token_systems_transferFrom = async (snAccount: Account | AccountInterface, from: string, to: string, tokenId: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_game_token_systems_transferFrom_calldata(from, to, tokenId),
				"ls_0_0_1",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_loot_systems_getItem_calldata = (itemId: BigNumberish): DojoCall => {
		return {
			contractName: "loot_systems",
			entrypoint: "get_item",
			calldata: [itemId],
		};
	};

	const loot_systems_getItem = async (itemId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_loot_systems_getItem_calldata(itemId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_loot_systems_getPrefix1_calldata = (itemId: BigNumberish, seed: BigNumberish): DojoCall => {
		return {
			contractName: "loot_systems",
			entrypoint: "get_prefix1",
			calldata: [itemId, seed],
		};
	};

	const loot_systems_getPrefix1 = async (itemId: BigNumberish, seed: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_loot_systems_getPrefix1_calldata(itemId, seed));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_loot_systems_getPrefix2_calldata = (itemId: BigNumberish, seed: BigNumberish): DojoCall => {
		return {
			contractName: "loot_systems",
			entrypoint: "get_prefix2",
			calldata: [itemId, seed],
		};
	};

	const loot_systems_getPrefix2 = async (itemId: BigNumberish, seed: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_loot_systems_getPrefix2_calldata(itemId, seed));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_loot_systems_getSlot_calldata = (itemId: BigNumberish): DojoCall => {
		return {
			contractName: "loot_systems",
			entrypoint: "get_slot",
			calldata: [itemId],
		};
	};

	const loot_systems_getSlot = async (itemId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_loot_systems_getSlot_calldata(itemId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_loot_systems_getSpecials_calldata = (itemId: BigNumberish, greatness: BigNumberish, seed: BigNumberish): DojoCall => {
		return {
			contractName: "loot_systems",
			entrypoint: "get_specials",
			calldata: [itemId, greatness, seed],
		};
	};

	const loot_systems_getSpecials = async (itemId: BigNumberish, greatness: BigNumberish, seed: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_loot_systems_getSpecials_calldata(itemId, greatness, seed));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_loot_systems_getSuffix_calldata = (itemId: BigNumberish, seed: BigNumberish): DojoCall => {
		return {
			contractName: "loot_systems",
			entrypoint: "get_suffix",
			calldata: [itemId, seed],
		};
	};

	const loot_systems_getSuffix = async (itemId: BigNumberish, seed: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_loot_systems_getSuffix_calldata(itemId, seed));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_loot_systems_getTier_calldata = (itemId: BigNumberish): DojoCall => {
		return {
			contractName: "loot_systems",
			entrypoint: "get_tier",
			calldata: [itemId],
		};
	};

	const loot_systems_getTier = async (itemId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_loot_systems_getTier_calldata(itemId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_loot_systems_getType_calldata = (itemId: BigNumberish): DojoCall => {
		return {
			contractName: "loot_systems",
			entrypoint: "get_type",
			calldata: [itemId],
		};
	};

	const loot_systems_getType = async (itemId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_loot_systems_getType_calldata(itemId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_loot_systems_isStartingWeapon_calldata = (itemId: BigNumberish): DojoCall => {
		return {
			contractName: "loot_systems",
			entrypoint: "is_starting_weapon",
			calldata: [itemId],
		};
	};

	const loot_systems_isStartingWeapon = async (itemId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_loot_systems_isStartingWeapon_calldata(itemId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_renderer_systems_createMetadata_calldata = (adventurerId: BigNumberish): DojoCall => {
		return {
			contractName: "renderer_systems",
			entrypoint: "create_metadata",
			calldata: [adventurerId],
		};
	};

	const renderer_systems_createMetadata = async (adventurerId: BigNumberish) => {
		try {
			return await provider.call("ls_0_0_1", build_renderer_systems_createMetadata_calldata(adventurerId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		adventurer_systems: {
			addItemToBag: adventurer_systems_addItemToBag,
			buildAddItemToBagCalldata: build_adventurer_systems_addItemToBag_calldata,
			addNewItemToBag: adventurer_systems_addNewItemToBag,
			buildAddNewItemToBagCalldata: build_adventurer_systems_addNewItemToBag_calldata,
			bagContains: adventurer_systems_bagContains,
			buildBagContainsCalldata: build_adventurer_systems_bagContains_calldata,
			generateStartingStats: adventurer_systems_generateStartingStats,
			buildGenerateStartingStatsCalldata: build_adventurer_systems_generateStartingStats_calldata,
			getAdventurer: adventurer_systems_getAdventurer,
			buildGetAdventurerCalldata: build_adventurer_systems_getAdventurer_calldata,
			getAdventurerName: adventurer_systems_getAdventurerName,
			buildGetAdventurerNameCalldata: build_adventurer_systems_getAdventurerName_calldata,
			getBag: adventurer_systems_getBag,
			buildGetBagCalldata: build_adventurer_systems_getBag_calldata,
			getBagItem: adventurer_systems_getBagItem,
			buildGetBagItemCalldata: build_adventurer_systems_getBagItem_calldata,
			getBattleRandomness: adventurer_systems_getBattleRandomness,
			buildGetBattleRandomnessCalldata: build_adventurer_systems_getBattleRandomness_calldata,
			getDiscovery: adventurer_systems_getDiscovery,
			buildGetDiscoveryCalldata: build_adventurer_systems_getDiscovery_calldata,
			getMarket: adventurer_systems_getMarket,
			buildGetMarketCalldata: build_adventurer_systems_getMarket_calldata,
			getRandomness: adventurer_systems_getRandomness,
			buildGetRandomnessCalldata: build_adventurer_systems_getRandomness_calldata,
			isBagFull: adventurer_systems_isBagFull,
			buildIsBagFullCalldata: build_adventurer_systems_isBagFull_calldata,
			loadAssets: adventurer_systems_loadAssets,
			buildLoadAssetsCalldata: build_adventurer_systems_loadAssets_calldata,
			packAdventurer: adventurer_systems_packAdventurer,
			buildPackAdventurerCalldata: build_adventurer_systems_packAdventurer_calldata,
			packBag: adventurer_systems_packBag,
			buildPackBagCalldata: build_adventurer_systems_packBag_calldata,
			removeItemFromBag: adventurer_systems_removeItemFromBag,
			buildRemoveItemFromBagCalldata: build_adventurer_systems_removeItemFromBag_calldata,
			removeStatBoosts: adventurer_systems_removeStatBoosts,
			buildRemoveStatBoostsCalldata: build_adventurer_systems_removeStatBoosts_calldata,
		},
		beast_systems: {
			attemptFlee: beast_systems_attemptFlee,
			buildAttemptFleeCalldata: build_beast_systems_attemptFlee_calldata,
			getBeast: beast_systems_getBeast,
			buildGetBeastCalldata: build_beast_systems_getBeast_calldata,
			getCriticalHitChance: beast_systems_getCriticalHitChance,
			buildGetCriticalHitChanceCalldata: build_beast_systems_getCriticalHitChance_calldata,
			getStarterBeast: beast_systems_getStarterBeast,
			buildGetStarterBeastCalldata: build_beast_systems_getStarterBeast_calldata,
		},
		game_systems: {
			attack: game_systems_attack,
			buildAttackCalldata: build_game_systems_attack_calldata,
			buyItems: game_systems_buyItems,
			buildBuyItemsCalldata: build_game_systems_buyItems_calldata,
			drop: game_systems_drop,
			buildDropCalldata: build_game_systems_drop_calldata,
			equip: game_systems_equip,
			buildEquipCalldata: build_game_systems_equip_calldata,
			explore: game_systems_explore,
			buildExploreCalldata: build_game_systems_explore_calldata,
			flee: game_systems_flee,
			buildFleeCalldata: build_game_systems_flee_calldata,
			selectStatUpgrades: game_systems_selectStatUpgrades,
			buildSelectStatUpgradesCalldata: build_game_systems_selectStatUpgrades_calldata,
			startGame: game_systems_startGame,
			buildStartGameCalldata: build_game_systems_startGame_calldata,
		},
		game_token_systems: {
			approve: game_token_systems_approve,
			buildApproveCalldata: build_game_token_systems_approve_calldata,
			balanceOf: game_token_systems_balanceOf,
			buildBalanceOfCalldata: build_game_token_systems_balanceOf_calldata,
			emitMetadataUpdate: game_token_systems_emitMetadataUpdate,
			buildEmitMetadataUpdateCalldata: build_game_token_systems_emitMetadataUpdate_calldata,
			gameCount: game_token_systems_gameCount,
			buildGameCountCalldata: build_game_token_systems_gameCount_calldata,
			gameMetadata: game_token_systems_gameMetadata,
			buildGameMetadataCalldata: build_game_token_systems_gameMetadata_calldata,
			getApproved: game_token_systems_getApproved,
			buildGetApprovedCalldata: build_game_token_systems_getApproved_calldata,
			isApprovedForAll: game_token_systems_isApprovedForAll,
			buildIsApprovedForAllCalldata: build_game_token_systems_isApprovedForAll_calldata,
			mint: game_token_systems_mint,
			buildMintCalldata: build_game_token_systems_mint_calldata,
			name: game_token_systems_name,
			buildNameCalldata: build_game_token_systems_name_calldata,
			ownerOf: game_token_systems_ownerOf,
			buildOwnerOfCalldata: build_game_token_systems_ownerOf_calldata,
			safeTransferFrom: game_token_systems_safeTransferFrom,
			buildSafeTransferFromCalldata: build_game_token_systems_safeTransferFrom_calldata,
			score: game_token_systems_score,
			buildScoreCalldata: build_game_token_systems_score_calldata,
			scoreAttribute: game_token_systems_scoreAttribute,
			buildScoreAttributeCalldata: build_game_token_systems_scoreAttribute_calldata,
			scoreModel: game_token_systems_scoreModel,
			buildScoreModelCalldata: build_game_token_systems_scoreModel_calldata,
			setApprovalForAll: game_token_systems_setApprovalForAll,
			buildSetApprovalForAllCalldata: build_game_token_systems_setApprovalForAll_calldata,
			settingExists: game_token_systems_settingExists,
			buildSettingExistsCalldata: build_game_token_systems_settingExists_calldata,
			settingsModel: game_token_systems_settingsModel,
			buildSettingsModelCalldata: build_game_token_systems_settingsModel_calldata,
			supportsInterface: game_token_systems_supportsInterface,
			buildSupportsInterfaceCalldata: build_game_token_systems_supportsInterface_calldata,
			symbol: game_token_systems_symbol,
			buildSymbolCalldata: build_game_token_systems_symbol_calldata,
			tokenMetadata: game_token_systems_tokenMetadata,
			buildTokenMetadataCalldata: build_game_token_systems_tokenMetadata_calldata,
			tokenUri: game_token_systems_tokenUri,
			buildTokenUriCalldata: build_game_token_systems_tokenUri_calldata,
			transferFrom: game_token_systems_transferFrom,
			buildTransferFromCalldata: build_game_token_systems_transferFrom_calldata,
		},
		loot_systems: {
			getItem: loot_systems_getItem,
			buildGetItemCalldata: build_loot_systems_getItem_calldata,
			getPrefix1: loot_systems_getPrefix1,
			buildGetPrefix1Calldata: build_loot_systems_getPrefix1_calldata,
			getPrefix2: loot_systems_getPrefix2,
			buildGetPrefix2Calldata: build_loot_systems_getPrefix2_calldata,
			getSlot: loot_systems_getSlot,
			buildGetSlotCalldata: build_loot_systems_getSlot_calldata,
			getSpecials: loot_systems_getSpecials,
			buildGetSpecialsCalldata: build_loot_systems_getSpecials_calldata,
			getSuffix: loot_systems_getSuffix,
			buildGetSuffixCalldata: build_loot_systems_getSuffix_calldata,
			getTier: loot_systems_getTier,
			buildGetTierCalldata: build_loot_systems_getTier_calldata,
			getType: loot_systems_getType,
			buildGetTypeCalldata: build_loot_systems_getType_calldata,
			isStartingWeapon: loot_systems_isStartingWeapon,
			buildIsStartingWeaponCalldata: build_loot_systems_isStartingWeapon_calldata,
		},
		renderer_systems: {
			createMetadata: renderer_systems_createMetadata,
			buildCreateMetadataCalldata: build_renderer_systems_createMetadata_calldata,
		},
	};
}