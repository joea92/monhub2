import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

export default function DonationModal({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            Support This App
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have been enjoying using this app and want to help keep me developing it and adding more features, buy me a coffee (or beer) and keep working on it! If you have an idea or feature you'd like me to add feel free to add it in the donation comment section. Thank you!
          </p>
          <a href="http://buymeacoffee.com/monhub" target="_blank" rel="noopener noreferrer" className="block">
            <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Heart className="w-4 h-4" />
              Buy Me A Coffee
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}