import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Separator } from "../ui/separator";
import { Check, Clock, X } from "lucide-react";

type TooltipPayload = ReadonlyArray<any>;

type Coordinate = {
    x: number;
    y: number;
};

type PieSectorData = {
    percent?: number;
    name?: string | number;
    midAngle?: number;
    middleRadius?: number;
    tooltipPosition?: Coordinate;
    value?: number;
    paddingAngle?: number;
    dataKey?: string;
    payload?: any;
    tooltipPayload?: ReadonlyArray<TooltipPayload>;
};

type GeometrySector = {
    cx: number;
    cy: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
};

type PieLabelProps = PieSectorData &
    GeometrySector & {
        tooltipPayload?: any;
    };

const RADIAN = Math.PI / 180;
const COLORS = ["#00c951", "#f0b100", "#fb2c36"];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelProps) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
    const y = cy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);
    
    if (percent == 0) return;

    return (
        <text x={x} y={y} fill="#262626" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
            {`${((percent ?? 1) * 100).toFixed(0)}%`}
        </text>
    );
};

export default function ExchangesStats({ totalExchanges, exchangeCounts }: {
    totalExchanges: number, exchangeCounts: {
        pending: number,
        accepted: number,
        rejected: number
    }
}) {
    const data = [
        { name: "accepted", value: exchangeCounts.accepted },
        { name: "pending", value: exchangeCounts.pending },
        { name: "rejected", value: exchangeCounts.rejected }
    ];

    return (
        <>
            <div className="flex flex-col gap-2">
                <h3 className="text-sm text-muted-foreground">Intercambios totales</h3>
                <p className="text-4xl font-bold mb-1">{totalExchanges.toLocaleString()}</p>
                <Separator />
                <div className="flex gap-3">
                    <p className="text-xs text-muted-foreground">
                        <Check className="inline" size={12} color={COLORS[0]} /> {exchangeCounts.accepted.toLocaleString()} aceptados
                    </p>
                    <p className="text-xs text-muted-foreground">
                        <Clock className="inline" size={12} color={COLORS[1]} /> {exchangeCounts.pending.toLocaleString()} pendientes
                    </p>
                    <p className="text-xs text-muted-foreground">
                        <X className="inline" size={12} color={COLORS[2]} /> {exchangeCounts.rejected.toLocaleString()} rechazados
                    </p>
                </div>
            </div>
            <ResponsiveContainer minHeight={140}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={65}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </>
    );
}