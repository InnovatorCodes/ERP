import { DetailsFormProps } from "./product-fields";
import { ProductWithFiles } from "@/types/products";
import { SharedSofaDetailsForm } from "../shared/sofa-details-form";

export const SofaDetailsForm: React.FC<DetailsFormProps<ProductWithFiles>> = (props) => {
    return <SharedSofaDetailsForm {...props} />;
};
