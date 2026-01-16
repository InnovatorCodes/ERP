import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function CustomerHeader() {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">Customers</h1>
      <Button>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Customer
      </Button>
    </div>
  );
}
