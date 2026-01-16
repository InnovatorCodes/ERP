import { DetailsFormProps, InputField, TextAreaField, ToggleGroupField, ComboboxField } from "../place-order/product-fields";
import { ProductWithFiles } from "@/types/products";
import { useState, useEffect } from "react";

export const SharedSofaDetailsForm: React.FC<DetailsFormProps<ProductWithFiles>> = ({ index, product, handleProductChange, disabled, baseName, nameError }) => {
    const [includeRecliner, setIncludeRecliner] = useState<boolean | null>(
        !!product.recliner_mechanism_mode || !!product.recliner_mechanism_flip
    );
    const [includeCupHolder, setIncludeCupHolder] = useState<boolean | null>(!!product.cup_holder);

    useEffect(() => {
        if (product.id) return;
        // Set default to the first option for all toggle groups
        handleProductChange(index, "wood_to_floor", true); // Wood
        handleProductChange(index, "headrest_mode", "manual");
        handleProductChange(index, "snack_swivel_tray", true); // Yes
        handleProductChange(index, "armrest_storage", true); // Yes
        handleProductChange(index, "belt_details", "elastic_belt");
        handleProductChange(index, "leg_type", "wood");
        handleProductChange(index, "chester_option", "with_button");
        handleProductChange(index, "polish_finish", "matt_finish");
    }, [product.id, handleProductChange, index]);

    useEffect(() => {
        setIncludeCupHolder(!!product.cup_holder);
    }, [product.cup_holder]);

    useEffect(() => {
        setIncludeRecliner(!!product.recliner_mechanism_mode || !!product.recliner_mechanism_flip);
    }, [product.recliner_mechanism_mode, product.recliner_mechanism_flip]);

    useEffect(() => {
        if (includeRecliner) {
            if (!product.recliner_mechanism_mode) {
                handleProductChange(index, "recliner_mechanism_mode", 'manual');
            }
            if (!product.recliner_mechanism_flip) {
                handleProductChange(index, "recliner_mechanism_flip", 'single_flip');
            }
        }
    }, [includeRecliner, product.recliner_mechanism_mode, product.recliner_mechanism_flip, handleProductChange, index]);

    useEffect(() => {
        if (includeCupHolder && !product.cup_holder) {
            handleProductChange(index, "cup_holder", 'normal_push_back');
        }
    }, [includeCupHolder, product.cup_holder, handleProductChange, index]);

    useEffect(() => {
        if (product.armrest_storage && !product.storage_side) {
            handleProductChange(index, "storage_side", 'rhs_arm');
        }
    }, [product.armrest_storage, product.storage_side, handleProductChange, index]);

    useEffect(() => {
        const isDaybed = product.model_family_configuration === '3+daybed' || product.model_family_configuration === '2+daybed';
        if (isDaybed) {
            if (!product.daybed_headrest_mode) {
                handleProductChange(index, "daybed_headrest_mode", 'manual');
            }
            if (!product.daybed_position) {
                handleProductChange(index, "daybed_position", 'rhs');
            }
        } else {
            handleProductChange(index, "daybed_headrest_mode", null);
            handleProductChange(index, "daybed_position", null);
        }
    }, [product.model_family_configuration, product.daybed_headrest_mode, product.daybed_position, handleProductChange, index]);

    const upholsteryOptions = [
        {value: 'fabric', label: 'Fabric'}, {value: 'pu', label: 'PU'}, {value: 'leather_bloom', label: 'Leather Bloom'},
        {value: 'leather_floater', label: 'Leather Floater'}, {value: 'leather_floater_max', label: 'Leather Floater Max'},
        {value: 'leather_platinum_max', label: 'Leather Platinum Max'}, {value: 'leather_european_nappa', label: 'Leather European Nappa'},
        {value: 'leather_smoothy_nappa', label: 'Leather Smoothy Nappa'}, {value: 'pu_leather', label: 'PU Leather'}
    ];

    const modelFamilyOptions = [
        { value: '1 str', label: '1 STR' },
        { value: '2 str', label: '2 STR' },
        { value: '3 str', label: '3 STR' },
        { value: '3+2 str', label: '3+2 STR' },
        { value: '3+daybed', label: '3+Daybed' },
        { value: '2+daybed', label: '2+Daybed' },
        { value: '3+cnr+3', label: '3+CNR+3' },
        { value: '3+cnr+2', label: '3+CNR+2' },
        { value: '2+cnr+2', label: '2+CNR+2' },
        { value: '3+cnr+1', label: '3+CNR+1' },
        { value: '2+cnr+1', label: '2+CNR+1' },
        { value: '3+2+1', label: '3+2+1' },
    ];

    const name = (fieldName: string) => baseName ? `${baseName}.${fieldName}` : fieldName;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {product.id && <InputField name={name("id")} label="Product ID" value={product.id} disabled={true} required/>}
            <InputField name={name("model_name")} label="Model Name" value={product.model_name || ''} error={nameError} disabled={disabled} onChange={(e) => handleProductChange(index, "model_name", e.target.value)} required/>
            <ComboboxField name={name("model_family_configuration")} label="Model Family Configuration" placeholder="Select Configuration" value={product.model_family_configuration} disabled={disabled} onValueChange={(val) => handleProductChange(index, "model_family_configuration", val)} options={modelFamilyOptions} required/>
            {(product.model_family_configuration === '3+2 str' || product.model_family_configuration === '3+2+1') && (
                <InputField name={name("2_seater_length")} label="2 Seater Length (in)" type="number" value={product['2_seater_length'] || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "2_seater_length", Number(e.target.value))} required/>
            )}
            {product.model_family_configuration === '3+2+1' && (
                <InputField name={name("1_seater_length")} label="1 Seater Length (in)" type="number" value={product['1_seater_length'] || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "1_seater_length", Number(e.target.value))} required/>
            )}
            {product.customization && (
                <span className="text-lg font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-md h-min w-min col-span-2">
                    Customized
                </span>
            )}
            <TextAreaField name={name("description")} label="Description" value={product.description || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "description", e.target.value)} />
            <ToggleGroupField 
                name="include_recliner"
                label="Include Recliner" 
                value={includeRecliner} 
                disabled={disabled} 
                onValueChange={(val) => {
                    setIncludeRecliner(val);
                    if (val === false || val === null) {
                        handleProductChange(index, "recliner_mechanism_mode", null);
                        handleProductChange(index, "recliner_mechanism_flip", null);
                        handleProductChange(index, "wood_to_floor", null);
                    }
                }} 
                options={[{value: true, label: 'Yes'}, {value: false, label: 'No'}]} 
                required
            />
            {includeRecliner && (
                <>
                    <ToggleGroupField name={name("recliner_mechanism_mode")} label="Recliner Mechanism" value={product.recliner_mechanism_mode} disabled={disabled} onValueChange={(val) => handleProductChange(index, "recliner_mechanism_mode", val)} options={[{value: 'manual', label: 'Manual'}, {value: 'motorized_single', label: 'Motorized Single'}, {value: 'motorized_double', label: 'Motorized Double'}]} required/>
                    <ToggleGroupField name={name("recliner_mechanism_flip")} label="Recliner Flip" value={product.recliner_mechanism_flip} disabled={disabled} onValueChange={(val) => handleProductChange(index, "recliner_mechanism_flip", val)} options={[{value: 'single_flip', label: 'Single Flip'}, {value: 'double_flip', label: 'Double Flip'}, {value: 'double_motor_with_headrest', label: 'Double Motor with Headrest'}]} required/>
                </>
            )}
            {includeRecliner && (
                <ToggleGroupField name={name("wood_to_floor")} label="Wood to Floor" value={product.wood_to_floor} disabled={disabled || !includeRecliner} onValueChange={(val) => handleProductChange(index, "wood_to_floor", val)} options={[{value: true, label: 'Wood'}, {value: false, label: 'Metal'}]} required/>
            )}
            <ToggleGroupField 
                name={name("headrest_mode")} 
                label="Headrest Mode" 
                value={product.headrest_mode || 'fixed'} 
                disabled={disabled} 
                onValueChange={(val) => handleProductChange(index, "headrest_mode", val)} 
                options={[{value: 'manual', label: 'Manual'}, {value: 'motorized', label: 'Motorized'}, {value: 'fixed', label: 'Fixed'}]} 
                required
            />
            <ToggleGroupField
                name="include_cup_holder"
                label="Include Cup Holder"
                value={includeCupHolder}
                disabled={disabled}
                onValueChange={(val) => {
                    setIncludeCupHolder(val);
                    if (val === false || val === null) {
                        handleProductChange(index, "cup_holder", null);
                    }
                }}
                options={[{value: true, label: 'Yes'}, {value: false, label: 'No'}]}
                required
            />
            {includeCupHolder && (
                <ToggleGroupField name={name("cup_holder")} label="Cup Holder Type" value={product.cup_holder} disabled={disabled} onValueChange={(val) => handleProductChange(index, "cup_holder", val)} options={[{value: 'normal_push_back', label: 'Normal Push Back'}, {value: 'chiller_cup', label: 'Chiller Cup'}]} required/>
            )}
            <ToggleGroupField name={name("snack_swivel_tray")} label="Snack Swivel Tray" value={product.snack_swivel_tray} disabled={disabled} onValueChange={(val) => handleProductChange(index, "snack_swivel_tray", val)} options={[{value: true, label: 'Yes'}, {value: false, label: 'No'}]} required/>
            {(product.model_family_configuration === '3+daybed' || product.model_family_configuration === '2+daybed') && (
                <>
                    <ToggleGroupField 
                        name={name("daybed_headrest_mode")} 
                        label="Daybed Headrest" 
                        value={product.daybed_headrest_mode || 'fixed'} 
                        disabled={disabled} 
                        onValueChange={(val) => handleProductChange(index, "daybed_headrest_mode", val)} 
                        options={[{value: 'manual', label: 'Manual'}, {value: 'motorized', label: 'Motorized'}, {value: 'fixed', label: 'Fixed'}]} 
                        required
                    />
                    <ToggleGroupField name={name("daybed_position")} label="Daybed Position" value={product.daybed_position} disabled={disabled} onValueChange={(val) => handleProductChange(index, "daybed_position", val)} options={[{value: 'rhs', label: 'RHS'}, {value: 'lhs', label: 'LHS'}]} required/>
                </>
            )}
            <ToggleGroupField 
                name={name("armrest_storage")} 
                label="Armrest Storage" 
                value={product.armrest_storage} 
                disabled={disabled} 
                onValueChange={(val) => {
                    handleProductChange(index, "armrest_storage", val);
                    if (val === false || val === null) {
                        handleProductChange(index, "storage_side", null);
                    }
                }} 
                options={[{value: true, label: 'Yes'}, {value: false, label: 'No'}]} 
                required
            />
            {product.armrest_storage && (
                <ToggleGroupField name={name("storage_side")} label="Storage Side" value={product.storage_side} disabled={disabled} onValueChange={(val) => handleProductChange(index, "storage_side", val)} options={[{value: 'rhs_arm', label: 'RHS Arm'}, {value: 'lhs_arm', label: 'LHS Arm'}, {value: 'both_arm', label: 'Both Arms'}]} required/>
            )}
            <InputField name={name("foam_density_seating")} label="Foam Density (Seating)" type="number" value={product.foam_density_seating || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "foam_density_seating", Number(e.target.value))} required/>
            <InputField name={name("foam_density_backrest")} label="Foam Density (Backrest)" type="number" value={product.foam_density_backrest || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "foam_density_backrest", Number(e.target.value))} required/>
            <ToggleGroupField name={name("belt_details")} label="Belt Details" value={product.belt_details} disabled={disabled} onValueChange={(val) => handleProductChange(index, "belt_details", val)} options={[{value: 'elastic_belt', label: 'Elastic Belt'}, {value: 'zig_zag_spring', label: 'Zig Zag Spring'}, {value: 'pocket_spring', label: 'Pocket Spring'}]} required/>
            <ToggleGroupField name={name("leg_type")} label="Leg Type" value={product.leg_type} disabled={disabled} onValueChange={(val) => handleProductChange(index, "leg_type", val)} options={[{value: 'wood', label: 'Wood'}, {value: 'pvd', label: 'PVD'}, {value: 'ss', label: 'SS'}]} required/>
            <InputField name={name("pvd_color")} label="PVD Color" value={product.pvd_color || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "pvd_color", e.target.value)} required/>
            <ToggleGroupField 
                name={name("chester_option")} 
                label="Chester Option" 
                value={product.chester_option || 'no_chester'} 
                disabled={disabled} 
                onValueChange={(val) => {
                    if (val === 'no_chester') {
                        handleProductChange(index, "chester_option", 'no_chester');
                    } else {
                        handleProductChange(index, "chester_option", val);
                    }
                }} 
                options={[{value: 'with_button', label: 'With Button'}, {value: 'without_button', label: 'Without Button'}, {value: 'no_chester', label: 'No Chester'}]} 
                required
            />
            <InputField name={name("armrest_panels")} label="Armrest Panels" value={product.armrest_panels || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "armrest_panels", e.target.value)} required/>
            <ToggleGroupField 
                name={name("polish_finish")} 
                label="Polish Finish" 
                value={product.polish_finish} 
                disabled={disabled} 
                onValueChange={(val) => {
                    handleProductChange(index, "polish_finish", val);
                    if (val === 'no_polish') {
                        handleProductChange(index, "polish_color", null);
                    }
                }} 
                options={[{value: 'matt_finish', label: 'Matt Finish'}, {value: 'glossy_finish', label: 'Glossy Finish'}, {value: 'no_polish', label: 'No Polish'}]} 
                required
            />
            {product.polish_finish !== 'no_polish' && (
                <InputField name={name("polish_color")} label="Polish Color" value={product.polish_color || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "polish_color", e.target.value)} required/>
            )}
            <InputField name={name("total_width")} label="Total Width (in)" type="number" value={product.total_width || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "total_width", Number(e.target.value))} required/>
            <InputField name={name("total_depth")} label="Total Depth (in)" type="number" value={product.total_depth || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "total_depth", Number(e.target.value))} required/>
            <InputField name={name("total_height")} label="Total Height (in)" type="number" value={product.total_height || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "total_height", Number(e.target.value))} required/>
            <InputField name={name("seat_width")} label="Seat Width (in)" type="number" value={product.seat_width || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "seat_width", Number(e.target.value))} required/>
            <InputField name={name("seat_depth")} label="Seat Depth (in)" type="number" value={product.seat_depth || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "seat_depth", Number(e.target.value))} required/>
            <InputField name={name("seat_height")} label="Seat Height (in)" type="number" value={product.seat_height || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "seat_height", Number(e.target.value))} required/>
            <InputField name={name("armrest_width")} label="Armrest Width (in)" type="number" value={product.armrest_width || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "armrest_width", Number(e.target.value))} required/>
            <InputField name={name("armrest_depth")} label="Armrest Depth (in)" type="number" value={product.armrest_depth || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "armrest_depth", Number(e.target.value))} required/>
            <ComboboxField name={name("upholstery")} label="Upholstery" placeholder="Select Upholstery" value={product.upholstery} disabled={disabled} onValueChange={(val) => handleProductChange(index, "upholstery", val)} options={upholsteryOptions} required/>
            <InputField name={name("upholstery_color")} label="Upholstery Color" value={product.upholstery_color || ''} disabled={disabled} onChange={(e) => handleProductChange(index, "upholstery_color", e.target.value)} required/>
        </div>
    );
};
