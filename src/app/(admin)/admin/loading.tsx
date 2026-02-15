import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
            <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
    );
}
