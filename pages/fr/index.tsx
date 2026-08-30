import type { PageConfig } from "next";
import { propsAccueil } from "@/lib/props";
import Page from "../index";

export const config: PageConfig = { unstable_runtimeJS: false };
export const getStaticProps = propsAccueil("fr");
export default Page;
