import dynamic from "next/dynamic";
const Scheduler = dynamic(() => import("../components/Scheduler"), { ssr: false });
export default function Page() { return <Scheduler />; }
