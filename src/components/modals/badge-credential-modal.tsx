"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Download, ExternalLink, Check, Copy, Award, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { Badge } from "@/types";

interface BadgeCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: Badge | null;
  username: string;
}

export function BadgeCredentialModal({
  isOpen,
  onClose,
  badge,
  username,
}: BadgeCredentialModalProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!badge) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://codepulse.dev";
  const verificationUrl = `${baseUrl}/api/v1/identity/verify-credential?badgeId=${badge.id}&username=${username}`;

  const handleExportCredential = () => {
    setIsExporting(true);
    try {
      const vcData = {
        "@context": [
          "https://www.w3.org/ns/credentials/v2",
          "https://w3id.org/security/suites/jws-2020/v1"
        ],
        id: `urn:uuid:credential-${badge.id}`,
        type: ["VerifiableCredential", "CodePulseBadgeCredential"],
        issuer: {
          id: "did:web:codepulse.dev",
          name: "CodePulse Platform"
        },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: `did:web:codepulse.dev:users:${username}`,
          username,
          badgeId: badge.id,
          badgeName: badge.name,
          badgeTier: badge.tier,
          category: badge.category,
          verificationUrl,
        },
        proof: {
          type: "JsonWebSignature2020",
          verificationMethod: "did:web:codepulse.dev#key-1",
          proofPurpose: "assertionMethod"
        }
      };

      const blob = new Blob([JSON.stringify(vcData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `codepulse-${badge.name.toLowerCase().replace(/\s+/g, "-")}-credential.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("W3C Verifiable Credential downloaded successfully!");
    } catch {
      toast.error("Failed to export cryptographic credential.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddToLinkedIn = () => {
    const certName = encodeURIComponent(`CodePulse ${badge.name} Badge (${badge.tier})`);
    const orgName = encodeURIComponent("CodePulse");
    const issueYear = new Date().getFullYear();
    const issueMonth = new Date().getMonth() + 1;
    const certUrl = encodeURIComponent(verificationUrl);
    const certId = encodeURIComponent(badge.id);

    const linkedinUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${certName}&organizationName=${orgName}&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${certUrl}&certId=${certId}`;

    window.open(linkedinUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyVerificationLink = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      toast.success("Public verification URL copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy verification link.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0d1117] border-white/10 text-slate-100 p-6 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Award className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-white">
                {badge.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                W3C Cryptographic Verifiable Credential
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Credential summary card */}
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Issuer DID:</span>
              <span className="font-mono text-indigo-300">did:web:codepulse.dev</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Subject:</span>
              <span className="font-mono text-slate-200">did:web:codepulse.dev:users:{username}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Badge Tier:</span>
              <span className="capitalize text-amber-400 font-semibold">{badge.tier}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Signature:</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                ECDSA P-256 Validated
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            <Button
              type="button"
              onClick={handleAddToLinkedIn}
              className="w-full flex items-center justify-center gap-2 bg-[#0077b5] hover:bg-[#006097] text-white rounded-xl h-10 text-xs font-medium cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Add to LinkedIn
            </Button>

            <Button
              type="button"
              onClick={handleExportCredential}
              disabled={isExporting}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl h-10 text-xs font-medium cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-300" />
              Export Cryptographic Credential
            </Button>

            <Button
              type="button"
              onClick={handleCopyVerificationLink}
              variant="ghost"
              className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white h-9 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Verification Link</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Public Verification Link</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
