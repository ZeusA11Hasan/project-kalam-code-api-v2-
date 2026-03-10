"use client";

import { WhiteboardProvider } from '@/components/WhiteboardProvider';
import TutorClient from '@/components/tutor/TutorClient';

export default function TutorPage() {
    return (
        <WhiteboardProvider>
            <TutorClient />
        </WhiteboardProvider>
    );
}
