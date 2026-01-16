import { InputField, TextAreaField, ToggleGroupField, ComboboxField } from "../place-order/product-fields";
import { DetailsFormProps } from "../place-order/product-fields";
import { ProductWithFiles } from "@/types/products";
import { useEffect } from "react";

export const SharedBedDetailsForm: React.FC<DetailsFormProps<ProductWithFiles>> = ({ index, product, handleProductChange, disabled, baseName, nameError }) => {

    useEffect(() => {
        if (product.id) return;
        // Set default to the first option for all toggle groups
        handleProductChange(index, "bed_size", "king");
        handleProductChange(index, "headboard_type", "medium_back_4ft");
        handleProductChange(index, "storage_option", "hydraulic");
        handleProductChange(index, "bed_portion", "single");
        handleProductChange(index, "polish_finish", "matt_finish");
    }, [product.id, handleProductChange, index]);

    useEffect(() => {
        if (product.bed_size === 'customized' && !product.customized_mattress_size) {
            handleProductChange(index, "customized_mattress_size", '');
        }
    }, [product.bed_size, product.customized_mattress_size, handleProductChange, index]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {product.id && <InputField name={`${baseName}.id`} label="Product ID" value={product.id} disabled={true} required/>}
            <InputField name={`${baseName}.model_name`} label="Model Name" value={product.model_name || ''} error={nameError} disabled={disabled} onChange={(e) => handleProductChange(index, "model_name", e.target.value)} required/>
            <TextAreaField name={`${baseName}.description`} label="Description" value={product.description || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "description", e.target.value)} required />
            <ToggleGroupField name={`${baseName}.bed_size`} label="Bed Size" value={product.bed_size} disabled={disabled} onValueChange={(val) => handleProductChange(index, "bed_size", val)} options={[{value: 'king', label: 'King'}, {value: 'queen', label: 'Queen'}, {value: 'customized', label: 'Customized'}]} required/>
            {product.bed_size === "customized" && <InputField name={`${baseName}.customized_mattress_size`} label="Custom Mattress Size" value={product.customized_mattress_size || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "customized_mattress_size", e.target.value)} required/>}
            <ToggleGroupField name={`${baseName}.headboard_type`} label="Headboard Type" value={product.headboard_type} disabled={disabled} onValueChange={(val) => handleProductChange(index, "headboard_type", val)} options={[{value: 'medium_back_4ft', label: 'Medium Back 4ft'}, {value: 'high_back_4_5ft', label: 'High Back 4.5ft'}]} required/>
            <ToggleGroupField name={`${baseName}.storage_option`} label="Storage Option" value={product.storage_option} disabled={disabled} onValueChange={(val) => handleProductChange(index, "storage_option", val)} options={[{value: 'hydraulic', label: 'Hydraulic'}, {value: 'channel', label: 'Channel'}, {value: 'motorised', label: 'Motorised'}, {value: 'without_storage', label: 'Without Storage'}]} required/>
            <ToggleGroupField name={`${baseName}.bed_portion`} label="Bed Portion" value={product.bed_portion} disabled={disabled} onValueChange={(val) => handleProductChange(index, "bed_portion", val)} options={[{value: 'single', label: 'Single'}, {value: 'double', label: 'Double'}]} required/>
            <InputField name={`${baseName}.total_width`} label="Total Width (in)" type="number" value={product.total_width || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "total_width", Number(e.target.value))} required/>
            <InputField name={`${baseName}.total_depth`} label="Total Depth (in)" type="number" value={product.total_depth || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "total_depth", Number(e.target.value))} required/>
            <InputField name={`${baseName}.total_height`} label="Total Height (in)" type="number" value={product.total_height || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "total_height", Number(e.target.value))} required/>
            <ComboboxField name={`${baseName}.upholstery`} label="Upholstery" placeholder="Select Upholstery" value={product.upholstery} disabled={disabled} onValueChange={(val) => handleProductChange(index, "upholstery", val)} options={[{value: 'fabric', label: 'Fabric'}, {value: 'pu', label: 'PU'}, {value: 'leather_bloom', label: 'Leather Bloom'}]} required/>
            <InputField name={`${baseName}.upholstery_color`} label="Upholstery Color" value={product.upholstery_color || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "upholstery_color", e.target.value)} required/>
            <InputField name={`${baseName}.polish_color`} label="Polish Color" value={product.polish_color || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "polish_color", e.target.value)} required/>
            <ToggleGroupField name={`${baseName}.polish_finish`} label="Polish Finish" value={product.polish_finish} disabled={disabled} onValueChange={(val) => handleProductChange(index, "polish_finish", val)} options={[{value: 'matt_finish', label: 'Matt Finish'}, {value: 'glossy_finish', label: 'Glossy Finish'}]} required/>
        </div>
    );
};
