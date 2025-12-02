import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon } from "lucide-react";
import { format, isAfter } from "date-fns";
import { Button } from "../../components/ui/Button";
import { Label } from "../../components/ui/Label";
import { Checkbox } from "../../components/ui/Checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/Popover";
import { Calendar } from "../../components/ui/Calendar";
import { cn } from "../../utils/cn";
import type { ReportInput } from "../../types/report";

const reportSchema = z
  .object({
    reportType: z.enum(["Sales", "Forecast", "Inventory", "Performance"], {
      errorMap: () => ({ message: "Valid report type is required" }),
    }),
    format: z.enum(["csv", "pdf"], {
      errorMap: () => ({ message: "Valid format is required" }),
    }),
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((data) => !isAfter(data.startDate, data.endDate), {
    message: "Start date must be before end date",
    path: ["startDate"],
  })
  .refine((data) => !isAfter(data.startDate, new Date()), {
    message: "Start date cannot be in the future",
    path: ["startDate"],
  })
  .refine((data) => !isAfter(data.endDate, new Date()), {
    message: "End date cannot be in the future",
    path: ["endDate"],
  });

type ReportFormValues = z.infer<typeof reportSchema>;

interface ReportGeneratorProps {
  onSuccess: (data: ReportInput) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const ReportGenerator = ({
  onSuccess,
  onCancel,
  isLoading,
}: ReportGeneratorProps) => {
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: "Sales",
      format: "pdf",
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      endDate: new Date(),
    },
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const reportType = watch("reportType");

  const onSubmit = (data: ReportFormValues) => {
    console.log("Form submitted with data:", data); // <-- Debug log

    const reportData: ReportInput = {
      reportType: data.reportType,
      format: data.format,
      startDate: format(data.startDate, "yyyy-MM-dd"),
      endDate: format(data.endDate, "yyyy-MM-dd"),
    };
    onSuccess(reportData);
  };

  const availableReportTypes = [
    { id: "Sales", label: "Sales Report" },
    { id: "Forecast", label: "Forecast Report" },
    { id: "Inventory", label: "Inventory Report" },
    { id: "Performance", label: "Performance Report" },
  ];

  const availableFormats = [
    { id: "csv", label: "CSV" },
    { id: "pdf", label: "PDF" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>Report Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {availableReportTypes.map((type) => (
            <div key={type.id} className="flex items-center space-x-2">
              <Checkbox
                id={`reportType-${type.id}`}
                checked={reportType === type.id}
                onCheckedChange={() => setValue("reportType", type.id as any)}
              />
              <Label
                htmlFor={`reportType-${type.id}`}
                className="cursor-pointer"
              >
                {type.label}
              </Label>
            </div>
          ))}
        </div>
        {errors.reportType && (
          <p className="text-sm text-destructive">
            {errors.reportType.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Format</Label>
        <div className="grid grid-cols-2 gap-2">
          {availableFormats.map((format) => (
            <div key={format.id} className="flex items-center space-x-2">
              <Checkbox
                id={`format-${format.id}`}
                checked={watch("format") === format.id}
                onCheckedChange={() => setValue("format", format.id as any)}
              />
              <Label htmlFor={`format-${format.id}`} className="cursor-pointer">
                {format.label}
              </Label>
            </div>
          ))}
        </div>
        {errors.format && (
          <p className="text-sm text-destructive">{errors.format.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setValue("startDate", date)}
                disabled={(date) => isAfter(date, new Date())}
              />
            </PopoverContent>
          </Popover>
          {errors.startDate && (
            <p className="text-sm text-destructive">
              {errors.startDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => date && setValue("endDate", date)}
                disabled={(date) => isAfter(date, new Date())}
              />
            </PopoverContent>
          </Popover>
          {errors.endDate && (
            <p className="text-sm text-destructive">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Report"}
        </Button>
      </div>
    </form>
  );
};

export default ReportGenerator;
