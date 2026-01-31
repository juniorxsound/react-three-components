import type { GroupProps } from "../../types";
import { useLinearCarouselContext } from "./context";

export function LinearCarouselNextTrigger(props: GroupProps) {
  const { next } = useLinearCarouselContext();
  const { children, ...rest } = props;
  return (
    <group onClick={() => next()} {...rest}>
      {children}
    </group>
  );
}

export function LinearCarouselPrevTrigger(props: GroupProps) {
  const { prev } = useLinearCarouselContext();
  const { children, ...rest } = props;
  return (
    <group onClick={() => prev()} {...rest}>
      {children}
    </group>
  );
}
