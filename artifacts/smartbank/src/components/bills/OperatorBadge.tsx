export const OperatorBadge = ({ operator, circle }: { operator: string, circle: string }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/60 text-sm font-medium">
      <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
        {operator.substring(0, 1)}
      </div>
      <span>{operator} - {circle}</span>
    </div>
  );
};