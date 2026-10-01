import React from 'react';
import { NavLink } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cx } from './cn';

/**
 * Button — the single action primitive for the whole product.
 *
 * variant: primary | secondary | outline | ghost | soft | ai | danger
 * size:    sm | md | lg
 *
 * Renders a router <NavLink> when `to` is supplied, an <a> when `href` is
 * supplied, otherwise a native <button> — so semantics stay correct everywhere.
 */
const VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'soft', 'ai', 'danger'];
const SIZES = ['sm', 'md', 'lg'];

export function Button({
  to,
  href,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  full = false,
  square = false,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const safeVariant = VARIANTS.includes(variant) ? variant : 'primary';
  const safeSize = SIZES.includes(size) ? size : 'md';
  const iconOnly = square || (!children && Boolean(Icon || IconRight));

  const classes = cx(
    'cs-btn',
    `cs-btn-${safeVariant}`,
    `cs-btn-${safeSize}`,
    iconOnly && 'cs-btn-square',
    full && 'w-full',
    className
  );

  const inner = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : null}
      {children}
      {IconRight ? <IconRight className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
    </>
  );

  if (to && !disabled && !loading) {
    return (
      <NavLink to={to} className={classes} {...rest}>
        {inner}
      </NavLink>
    );
  }

  if (href && !disabled && !loading) {
    return (
      <a href={href} className={classes} {...rest}>
        {inner}
      </a>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {inner}
    </button>
  );
}

/** Square icon-only button with an accessible label. */
export function IconButton({ label, size = 'md', variant = 'ghost', icon: Icon, className = '', ...rest }) {
  return (
    <Button
      variant={variant}
      size={size}
      square
      aria-label={label}
      title={label}
      className={className}
      icon={Icon}
      {...rest}
    />
  );
}

/** Button group that visually welds adjacent actions together. */
export function ButtonGroup({ className = '', children }) {
  return <div className={cx('inline-flex items-center gap-2', className)}>{children}</div>;
}

export default Button;
