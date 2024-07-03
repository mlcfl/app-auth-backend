import {UniqueIdGenerator, UniqueIdGeneratorError} from '../index';

describe('UniqueIdGenerator class', () => {
	/**
	 * Generates an initial data with valid types
	 */
	test('.getInitialData() returns keys {isBlocked, src, maps} of the types {boolean, number[], {index: number, map: number[]}}', () => {
		const {isBlocked, src, maps} = UniqueIdGenerator.getInitialData({
			minNumber: 0,
			maxNumber: 1,
			parts: 2,
		});

		// isBlocked
		expect(typeof isBlocked).toBe('boolean');

		// src
		expect(Array.isArray(src)).toBe(true);
		expect(src.every((v) => typeof v === 'number')).toBe(true);

		// maps
		expect(Array.isArray(maps)).toBe(true);
		maps.forEach(({index, map}) => {
			expect(typeof index).toBe('number');
			expect(Array.isArray(map)).toBe(true);
			expect(map.every((v) => typeof v === 'number')).toBe(true);
		});
	});

	/**
	 * Generates all unique combinations
	 */
	test('.generate() with {minNumber: 0, maxNumber: 2, parts: 4} returns all 81 unique combinations', () => {
		const parts = 4;
		const maxNumber = 2;
		const ids = [];

		let data = UniqueIdGenerator.getInitialData({
			minNumber: 0,
			maxNumber,
			parts,
		});

		for (let i = 0; i <= 100; i++) {
			try {
				const {id, updatedUniqueData} = UniqueIdGenerator.generate(data);
				ids.push(id);
				data = updatedUniqueData;
			} catch (e) {
				break;
			}
		}

		expect(ids.length).toBe(Math.pow(maxNumber + 1, parts));
		expect(ids.length).toBe(new Set(ids).size);
	});

	/**
	 * Throws error after all generations
	 */
	test('.generate() throws an error of the type UniqueIdGeneratorError after generating all the combinations', () => {
		let error;
		let data = UniqueIdGenerator.getInitialData({
			minNumber: 0,
			maxNumber: 2,
			parts: 4,
		});

		for (let i = 0; i <= 100; i++) {
			try {
				const {updatedUniqueData} = UniqueIdGenerator.generate(data);
				data = updatedUniqueData;
			} catch (e) {
				error = e;
				break;
			}
		}

		expect(error instanceof UniqueIdGeneratorError).toBe(true);
		expect((error as UniqueIdGeneratorError).name).toBe('UniqueIdGeneratorError');
	});
});
