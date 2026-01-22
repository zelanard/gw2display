import React, { createContext, useContext } from "react";

export const TitleContext = createContext({
  title: "",
  setTitle: (_title) => {},
});

export function useTitle() {
  return useContext(TitleContext);
}
