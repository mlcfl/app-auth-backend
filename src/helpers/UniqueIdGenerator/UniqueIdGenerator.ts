import {UniqueIdGeneratorError, UniqueIdGeneratorErrorCodes} from './UniqueIdGeneratorError';
import type {GetInitialDataProps, UniqueData, UniqueDataMap} from './types';

/**
 * Generates ids like 0000-0000-0000-0000, where:
 * 1. The number of parts may be different;
 * 2. One part may contain numbers only.
 */
export class UniqueIdGenerator {
	private static readonly leadingZerosNumber = 4;
	private static readonly error = new UniqueIdGeneratorError({
		code: UniqueIdGeneratorErrorCodes.AllCreated,
		message: 'All ids for this instance were created',
	});

	/**
	 * Creates an initial data for id generations
	 */
	static getInitialData({minNumber, maxNumber, parts}: GetInitialDataProps): UniqueData {
		const initialArray = this.getInitialArray(minNumber, maxNumber);
		const maps: UniqueDataMap[] = [];

		for (let i = 0; i < parts; i++) {
			maps.push({
				map: [...initialArray],
				index: this.getRandomIndex(initialArray),
			});
		}

		return {
			isBlocked: false,
			src: [...initialArray],
			maps,
		};
	}

	/**
	 * Generates a new id
	 *
	 * Returns id and updated `uniqueData` object.
	 * `uniqueData.src` and `uniqueData.maps` are mutable.
	 */
	static generate(uniqueData: UniqueData): {id: string[]; updatedUniqueData: UniqueData;} {
		const {src, maps} = uniqueData;
		let {isBlocked} = uniqueData;

		if (isBlocked) {
			throw this.error;
		}

    const keys = [];
    const lastMapIndex = maps.length - 1;

    for (let i = lastMapIndex; i >= 0; i--) {
      const {map, index} = maps[i];

      // If it is not the last key add the key into array
      if (i !== lastMapIndex) {
        keys.unshift(map[index]);
        continue;
      }

      // If it is the last key
      if (map.length) {
        // If the array is not empty add the key into array
        const [key] = map.splice(index, 1);
        maps[i].index = this.getRandomIndex(map);
        keys.unshift(key);
      } else {
        // If the array is empty find a previous map
        const prevIndex = this.getPreviousIndex(maps, i);

        if (prevIndex === null) {
          isBlocked = true;
          throw this.error;
        }

        const {map: prevMap, index: prevMapIndex} = maps[prevIndex];

        // Delete the found index and create a new one
        prevMap.splice(prevMapIndex, 1);
        maps[prevIndex].index = this.getRandomIndex(prevMap);

        // Restoration of subsequent arrays
        for (let j = prevIndex + 1; j <= lastMapIndex; j++) {
          maps[j].map = [...src];
          maps[j].index = this.getRandomIndex(maps[j].map);
        }

        // Add the key into array
        const {map, index} = maps[i];
        const [key] = map.splice(index, 1);
        maps[i].index = this.getRandomIndex(map);
        keys.unshift(key);
      }
    }

    return {
      id: keys.map(this.addLeadingZeros.bind(this)),
      updatedUniqueData: {
        isBlocked,
        src,
        maps,
      },
    };
	}

	/**
	 * Create an initial array and fill it with numbers
	 */
	private static getInitialArray(minNumber: number, maxNumber: number): number[] {
		const data: number[] = [];

		for (let i = minNumber; i <= maxNumber; i++) {
			data.push(i);
		}

		return data;
	}

	/**
	 * Returns a random index for an array
	 */
	private static getRandomIndex(array: number[]): number {
		return Math.floor(Math.random() * array.length);
	}

	/**
	 * Returns the index of the previous array that contains more than 1 element.
	 *
	 * 0 or 1 element in an array means that all the keys have been used, so need to move on to the beginning
	 */
	private static getPreviousIndex(maps: UniqueDataMap[], currentIndex: number): number | null {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (maps[i].map.length > 1) {
        return i;
      }
    }

    return null;
  }

	/**
	 * Adds leading zeros to a key
	 */
	private static addLeadingZeros(number: number): string {
		const leadingZeros = Array(this.leadingZerosNumber).fill('0').join('');

		return (leadingZeros + String(number)).slice(-this.leadingZerosNumber);
	}
}
