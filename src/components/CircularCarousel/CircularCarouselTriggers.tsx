import type { GroupProps } from "../../types";
import { useCarouselContext } from "./context";

export function CircularCarouselNextTrigger(props: GroupProps) {
  const { next } = useCarouselContext();
  const { children, ...rest } = props;
  return (
    <group onClick={() => next()} {...rest}>
      {children}
    </group>
  );
}

export function CircularCarouselPrevTrigger(props: GroupProps) {
  const { prev } = useCarouselContext();
  const { children, ...rest } = props;
  return (
    <group onClick={() => prev()} {...rest}>
      {children}
    </group>
  );
}
