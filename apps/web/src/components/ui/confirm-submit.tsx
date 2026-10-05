"use client";

import { Button, type ButtonProps } from "./button";

/**
 * A form's submit button that asks first. For a server-action form whose step
 * cannot be undone (removing a saved scenario, A3-journeys-33): the browser's
 * own confirm, in the reader's words, and the form posts only on yes.
 */
export function ConfirmSubmit({ confirm, onClick, ...props }: ButtonProps & { confirm: string }) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(e) => {
        if (!window.confirm(confirm)) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    />
  );
}
