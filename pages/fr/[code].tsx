import type { PageConfig } from "next";
import { propsWilaya } from "@/lib/props";
import Page, { getStaticPaths } from "../[code]";

export const config: PageConfig = { unstable_runtimeJS: false };
export { getStaticPaths };
export const getStaticProps = propsWilaya("fr");
export default Page;
