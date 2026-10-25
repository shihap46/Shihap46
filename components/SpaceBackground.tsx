// One continuous animated sky behind every page: drifting star layers, slow aurora
// glows and an occasional shooting star. Pure CSS, so it costs no WebGL context.
export default function SpaceBackground() {
  return (
    <div className="space-bg" aria-hidden>
      <div className="space-aurora space-aurora--a" />
      <div className="space-aurora space-aurora--b" />
      <div className="space-aurora space-aurora--c" />
      <div className="space-stars space-stars--far" />
      <div className="space-stars space-stars--mid" />
      <div className="space-stars space-stars--near" />
      <span className="space-comet space-comet--1" />
      <span className="space-comet space-comet--2" />
    </div>
  );
}
