"use client";

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/upload'); // Send users directly to upload
} 
