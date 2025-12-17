import { UploadDropzone } from "@/lib/uploadthing"
import { XIcon } from "lucide-react"


interface ImageUploadProps {
    onChange: (url: string) => void
    value: string
    endpoint: "postImage"
}

function ImageUpload({ onChange, value, endpoint }: ImageUploadProps) {
    if(value){
        return(
            <div className="relative size-40">
                <img src={value} alt="upload" className="rounded-md size-40 object-cover"/>
                <button
                className="absolute top-0 right-0 p-1 bg-red-500 hover:bg-red-700 rounded-full shadow-sm"
                onClick={() => onChange("")}
                type="button"
                >
                    <XIcon className="h-4 w-4 text-white"/>
                </button>
            </div>
        )
    }
    return (
        <div>
            <UploadDropzone
                endpoint={endpoint}
                onClientUploadComplete={(res) => {
                    onChange(res?.[0].ufsUrl)
                }}
                onUploadError={(err: Error) => { console.log(err) }}
            />
        </div>
    )
}

export default ImageUpload;
