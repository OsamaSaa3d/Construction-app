import type { ReactNode } from "react";
import { Geist } from "next/font/google";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


type Props = {
  children: ReactNode;
};

export default function RootLayout({ children }: Props) {
  return children;
}
