import { DetailsFormProps } from "./product-fields";
import { ProductWithFiles } from "@/types/products";
import { SharedBedDetailsForm } from "../shared/bed-details-form";

export const BedDetailsForm: React.FC<DetailsFormProps<ProductWithFiles>> = (props) => {
    return <SharedBedDetailsForm {...props} />;
};
