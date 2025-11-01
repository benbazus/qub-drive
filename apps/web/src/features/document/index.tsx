import { useParams } from "@tanstack/react-router";
import { KingsEditor } from "./components/kingsEditor";


export default function DocumentPage() {

    const params = useParams({ from: '/document/$documentId' })

    return <KingsEditor documentId={params.documentId} />;



}

