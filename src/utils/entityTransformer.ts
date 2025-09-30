import { getSavedTime } from "./getSavedTime";

export function entityTransformer() {

    return {
        to: (value: string | null ) => value,
        from: (value: string | null | Date) => {

            if (value instanceof Date) {
                return getSavedTime(value);
            }

            return value;
        }
    }
}