import {
  ArrowUpRight,
  Check,
  Image as ImageIcon,
  MoveUpRight,
} from "lucide-react";
import { brand } from "../config";
import { track } from "../analytics";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a
      className={`logo ${compact ? "logo-compact" : ""}`}
      href="#inicio"
      aria-label="Auren Capital — início"
    >
      {brand.logo ? (
        <img src={brand.logo} alt="Auren Capital" width="473" height="169" />
      ) : (
        <>
          <span className="brand-symbol" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="brand-name">
            auren<span>CAPITAL</span>
          </span>
        </>
      )}
    </a>
  );
}

export function PrimaryButton({
  children,
  className = "",
  section = "pagina",
}: {
  children: React.ReactNode;
  className?: string;
  section?: string;
}) {
  return (
    <a
      className={`button button-primary ${className}`}
      href="#diagnostico"
      onClick={() => track("click_primary_cta", { section })}
    >
      <span>{children}</span>
      <ArrowUpRight size={19} aria-hidden="true" />
    </a>
  );
}

export function Eyebrow({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <p className={`eyebrow ${light ? "eyebrow-dark" : ""}`}>
      <span aria-hidden="true" />
      {children}
    </p>
  );
}

export function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="check-item">
      <Check size={16} aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

export function Portrait({
  variant = "hero",
}: {
  variant?: "hero" | "founder";
}) {
  const source = brand.portraits[variant];
  return (
    <div
      className={`portrait portrait-${variant}${source ? " has-photo" : ""}`}
    >
      <div className="portrait-orbit" aria-hidden="true" />
      <div className="portrait-orbit orbit-inner" aria-hidden="true" />
      {source ? (
        <img
          className="founder-photo"
          src={source}
          alt="Vandilton Santos, Auren Capital"
          width="1080"
          height="1440"
          loading={variant === "hero" ? "eager" : "lazy"}
        />
      ) : (
        <>
          <span className="portrait-monogram" aria-hidden="true">
            VS<span>.</span>
          </span>
          <span className="portrait-placeholder">
            <ImageIcon size={14} aria-hidden="true" /> Espaço reservado à foto
            oficial
          </span>
        </>
      )}
      <div className="portrait-caption">
        <span className="portrait-signature">Vandilton Santos</span>
        <span>Experiência bancária. Visão empresarial.</span>
      </div>
      {variant === "hero" && (
        <div className="experience-note">
          <MoveUpRight size={23} aria-hidden="true" />
          <div>
            <strong>Quase 8 anos</strong>
            <span>no setor bancário</span>
          </div>
        </div>
      )}
    </div>
  );
}
