import { Button } from "@/components/ui/button"

export function CartoonDemo() {
    return (
        <div className="flex flex-row gap-4 p-10 bg-[#050505]">
            <Button variant="default">Click me!</Button>
            <Button variant="premium">Premium Action</Button>
            <Button variant="outline" disabled>Disabled State</Button>
        </div>
    )
}
