import { CircleAlert } from "lucide-react";
import { Button } from "../ui/button";
import ReportForm from "../report-form";
import { useState } from "react";

export default function ReportBtn({ videoId, exchangeId }: { videoId?: string, exchangeId?: string }) {
    const [openReport, setOpenReport] = useState(false);

    return (
        <>
            <Button className="cursor-pointer bg-red-500 hover:bg-red-700 dark:text-secondary" onClick={() => setOpenReport(true)}>
                <CircleAlert />
            </Button>
            {openReport && <ReportForm videoId={videoId} exchangeId={exchangeId} openChange={() => setOpenReport(false)} />}
        </>
    );
}