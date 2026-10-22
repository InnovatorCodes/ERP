import { useState, useEffect } from "react";
import { OrderItem } from "./order-page-client";
import { Product, ProductWithFiles } from "@/types/products";
import { searchProducts } from "@/actions/search-products";
import { SofaDetailsForm } from "./sofa-details-form";
import { BedDetailsForm } from "./bed-details-form";
import { Plus, Minus, Sofa, Bed, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { SearchInput } from '@/components/ui/search-input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ImageUploadDisplayField } from "./image-upload-display-field";

type ProductEntryFormProps = {
    item: OrderItem;
    index: number;
    onItemChange: <K extends keyof OrderItem>(index: number, field: K, value: OrderItem[K]) => void;
    onDetailsChange: <K extends keyof ProductWithFiles>(index: number, detailField: K, value: ProductWithFiles[K] | null) => void;
    onProductSelect: (index: number, product: Product) => void;
    onRemove: (index: number) => void;
    isOnlyItem: boolean;
};

export const ProductEntryForm = ({ item, index, onItemChange, onDetailsChange, onProductSelect, onRemove, isOnlyItem }: ProductEntryFormProps) => {
    const [search, setSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isApiSearching, setIsApiSearching] = useState(false);

    const nameError = item.nameError;

    // Effect for debounced database search
    useEffect(() => {
        if (search.trim() === '' || !isSearching) {
            setSearchResults([]);
            return;
        }

        const handler = setTimeout(async () => {
            setIsApiSearching(true);
            const results = await searchProducts(search, item.type.toLowerCase() as 'sofa' | 'bed');
            setSearchResults(results);
            setIsApiSearching(false);
        }, 300); 

        return () => {
            clearTimeout(handler);
        };
    }, [search, item.type, isSearching]);

    useEffect(() => {
        if (!item.isCustom || !item.details.model_name) {
            onItemChange(index, 'nameError', '');
            return;
        }

        const checkName = async () => {
            const existingProducts = await searchProducts(item.details.model_name!, item.type.toLowerCase() as 'sofa' | 'bed');
            const isNameTaken = existingProducts.some(p => p.model_name?.toLowerCase() === item.details.model_name?.toLowerCase());
            if (isNameTaken) {
                onItemChange(index, 'nameError', `A ${item.type.toLowerCase()} with this name already exists.`);
            } else {
                onItemChange(index, 'nameError', '');
            }
        };

        const debounceTimeout = setTimeout(checkName, 500);
        return () => clearTimeout(debounceTimeout);

    }, [item.details.model_name, item.isCustom, item.type, item.id, index, onItemChange]);


    const baseName = `products[${index}]`;

    return (
        <section className="rounded-xl border bg-card shadow-sm">
            <input type="hidden" name={`${baseName}.product_type`} value={item.type.toLowerCase()} />
            <input type="hidden" name={`${baseName}.is_existing_model`} value={String(!!item.id)} />
            <input type="hidden" name={`${baseName}.is_customization`} value={String(item.isCustom)} />
            {item.id && <input type="hidden" name={`${baseName}.${item.type === 'Sofa' ? 'sofa_product_id' : 'bed_product_id'}`} value={item.id} />}
            <input type="hidden" name={`${baseName}.quantity`} value={item.quantity} />

            {/* Item header: type and model */}
            <div className="space-y-4 border-b p-5">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold text-foreground">Item {index + 1}</h2>
                    {!isOnlyItem && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemove(index)}
                            className="text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                        >
                            <Trash2 /> Remove
                        </Button>
                    )}
                </div>
                <div className="flex flex-col gap-3 md:flex-row">
                    <SegmentedControl
                        aria-label="Product type"
                        value={item.type}
                        onChange={(type) => onItemChange(index, 'type', type)}
                        options={[
                            { value: 'Sofa', label: 'Sofa', icon: Sofa },
                            { value: 'Bed', label: 'Bed', icon: Bed },
                        ]}
                        className="md:w-48"
                    />
                    <div className="relative flex-1">
                        <SearchInput
                            placeholder={`Search existing ${item.type.toLowerCase()} models...`}
                            value={item.id ? item.details.model_name ?? '' : search}
                            onChange={e => {
                                const newSearch = e.target.value;
                                setSearch(newSearch);
                                if (item.id) {
                                    onItemChange(index, 'id', null);
                                }
                            }}
                            onFocus={() => setIsSearching(true)}
                            onBlur={() => setTimeout(() => setIsSearching(false), 200)}
                            autoComplete="off"
                        />
                        {isSearching && search && (
                            <div className="absolute top-full z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg">
                                {isApiSearching ? (
                                    <p className="flex items-center gap-2 p-2 text-sm text-muted-foreground"><Loader2 className="size-3.5 animate-spin" /> Searching...</p>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(p => (
                                        <button
                                            type="button"
                                            key={p.id}
                                            onMouseDown={() => {
                                                onProductSelect(index, p);
                                                setSearch(p.model_name ?? '');
                                                setIsSearching(false);
                                            }}
                                            className="flex w-full items-center justify-between gap-2 rounded-md p-2 text-left text-sm hover:bg-accent"
                                        >
                                            <span className="truncate font-medium text-foreground">{p.model_name}</span>
                                            {p.customization && <Badge variant="accent">Customised</Badge>}
                                        </button>
                                    ))
                                ) : (
                                    <p className="p-2 text-sm text-muted-foreground">No models found. Turn on Customize to describe a new one.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Specification */}
            <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="font-medium text-foreground">Specification</h3>
                        <p className="text-sm text-muted-foreground">
                            {item.isCustom
                                ? (item.id ? 'Changes create a customised copy for this order; the catalogue model is not changed.' : 'Describe the new model below.')
                                : (item.id ? 'Ordered exactly as in the catalogue.' : 'Select an existing model above, or turn on Customize to describe a new one.')}
                        </p>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                        Customize
                        <Switch checked={item.isCustom} onCheckedChange={(checked) => onItemChange(index, 'isCustom', checked)} aria-label="Customize this item" />
                    </label>
                </div>
                {item.type === 'Sofa' && <SofaDetailsForm baseName={baseName} index={index} product={item.details} nameError={nameError} handleProductChange={onDetailsChange} disabled={!item.isCustom} />}
                {item.type === 'Bed' && <BedDetailsForm baseName={baseName} index={index} product={item.details} nameError={nameError} handleProductChange={onDetailsChange} disabled={!item.isCustom} />}
                <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
                    <ImageUploadDisplayField
                        label="Reference image"
                        name={`${baseName}.reference_image_url`}
                        dbImageUrl={typeof item.details.reference_image_url === 'string' ? item.details.reference_image_url : undefined}
                        file={item.details.reference_image_url instanceof File ? item.details.reference_image_url : undefined}
                        onFileChange={(file) => onDetailsChange(index, 'reference_image_url', file)}
                        disabled={!item.isCustom}
                    />
                    <ImageUploadDisplayField
                        label="Measurement drawing"
                        name={`${baseName}.measurement_drawing_url`}
                        dbImageUrl={typeof item.details.measurement_drawing_url === 'string' ? item.details.measurement_drawing_url : undefined}
                        file={item.details.measurement_drawing_url instanceof File ? item.details.measurement_drawing_url : undefined}
                        onFileChange={(file) => onDetailsChange(index, 'measurement_drawing_url', file)}
                        disabled={!item.isCustom}
                    />
                </div>
            </div>

            {/* Due date and quantity */}
            <div className="flex flex-wrap items-end justify-end gap-6 rounded-b-xl border-t bg-muted/50 p-5">
                <div className="space-y-1.5">
                    <label htmlFor={`due_date_${index}`} className="block text-sm font-medium text-foreground">
                        Due date<span className="ml-0.5 text-destructive">*</span>
                    </label>
                    <Input
                        type="date"
                        id={`due_date_${index}`}
                        name={`${baseName}.due_date`}
                        value={item.due_date ? item.due_date.toISOString().split('T')[0] : ''}
                        onChange={e => onItemChange(index, 'due_date', e.target.value ? new Date(e.target.value) : null)}
                        className="w-44 bg-card"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <span className="block text-sm font-medium text-foreground">Quantity</span>
                    <div className="flex h-9 items-center rounded-md border bg-card">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-r-none"
                            onClick={() => onItemChange(index, 'quantity', Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                        >
                            <Minus />
                        </Button>
                        <span className="w-12 text-center font-medium tabular-nums" aria-live="polite">{item.quantity}</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-l-none"
                            onClick={() => onItemChange(index, 'quantity', Math.min(1000, item.quantity + 1))}
                            aria-label="Increase quantity"
                        >
                            <Plus />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};
