import React from "react";
import { Link as RouterLink, type LinkProps as RouterLinkProps } from "react-router-dom";

export interface LinkProps extends Omit<RouterLinkProps, "to"> {
  href: string;
  children?: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, children, ...rest }, ref) => {
    return (
      <RouterLink to={href} ref={ref} {...rest}>
        {children}
      </RouterLink>
    );
  }
);

Link.displayName = "NextLinkShim";

export default Link;
