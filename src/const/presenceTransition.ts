export const defaultTransition = {
  transition: {
    duration: 0.2,
    ease: "easeOut",
    delay: 0.1,
  },
};
export const presenceTransition = {
  animate: {
    opacity: 1,
    scaleY: 1,
    originY: 0,
  },
  exit: {
    opacity: 0,
    padding: 0,
    margin: 0,
    height: 0,
  },
  initial: {
    opacity: 0,
    scaleY: 0,
    originY: 0,
  },
  transition: {
    duration: 0.2,
    ease: "easeOut",
    delay: 0.1,
  },
};
