export type GetInitialDataProps = {
	minNumber: number;
	maxNumber: number;
	parts: number;
};

export type UniqueDataMap = {
	index: number;
	map: number[];
};

export type UniqueData = {
	isBlocked: boolean;
	src: number[];
	maps: UniqueDataMap[];
};
