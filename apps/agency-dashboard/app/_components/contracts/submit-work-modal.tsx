"use client";

import { useState } from "react";
import { Icon } from "../ui/icon";
import type { AgencyContract } from "./types";

type SubmitWorkModalProps = {
  contract: AgencyContract;
  onClose: () => void;
  onSubmit: (input: {
    submissionMessage: string;
    submissionDeliveryLink?: string;
  }) => Promise<void>;
};

export function SubmitWorkModal({
  contract,
  onClose,
  onSubmit,
}: SubmitWorkModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [deliveryLink, setDeliveryLink] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitWork = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedComment = comment.trim();
    if (normalizedComment.length < 10) {
      setCommentError(
        "Add a comment of at least 10 characters before submitting.",
      );
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit({
        submissionMessage: normalizedComment,
        submissionDeliveryLink: deliveryLink.trim() || undefined,
      });
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Work could not be submitted.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-60 grid place-items-center bg-[#201a17]/45 p-5 backdrop-blur-[2px]"
      >
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fbe6da] text-[#d85a1b]">
            <Icon name="check-circle" size={30} />
          </span>
          <h2 className="mt-5 text-xl font-semibold">Company work submitted</h2>
          <p className="mt-2 text-sm leading-6 text-[#787470]">
            Your submission was sent to {contract.client} for review.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 h-11 w-full cursor-pointer rounded-xl bg-[#272624] text-sm font-semibold text-white"
          >
            Back to contracts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-work-title"
      className="fixed inset-0 z-60 grid place-items-center bg-[#201a17]/45 p-5 backdrop-blur-[2px]"
    >
      <form
        onSubmit={submitWork}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#e66d31] uppercase">
              Company milestone submission
            </p>
            <h2 id="submit-work-title" className="mt-2 text-xl font-semibold">
              Submit work for review
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer"
          >
            <Icon name="close" size={25} />
          </button>
        </div>
        <div className="mt-5 rounded-xl bg-[#f9f1ec] p-4">
          <p className="text-[11px] text-[#807c78]">{contract.client}</p>
          <p className="mt-1 text-sm font-semibold">
            {contract.currentMilestone}
          </p>
        </div>
        <label className="mt-5 block text-xs font-semibold">
          Comment to client <span className="text-[#a04d4d]">*</span>
          <textarea
            required
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
              if (commentError) setCommentError("");
            }}
            rows={5}
            placeholder="Summarize what the company completed, how the client can review it, and anything else they should know…"
            aria-invalid={Boolean(commentError)}
            className={`mt-2 w-full resize-none rounded-xl border p-3 text-sm font-normal outline-none ${
              commentError
                ? "border-[#c56b6b] focus:border-[#c56b6b]"
                : "border-black/10 focus:border-[#e77840]"
            }`}
          />
        </label>
        {commentError && (
          <p className="mt-2 text-[10px] font-medium text-[#a65050]">
            {commentError}
          </p>
        )}
        <p className="mt-2 text-[10px] leading-5 text-[#817d79]">
          Every milestone submission must include a clear review comment.
        </p>
        <label className="mt-4 block text-xs font-semibold">
          Deliverable link{" "}
          <span className="font-normal text-[#8f8b87]">(optional)</span>
          <input
            type="url"
            value={deliveryLink}
            onChange={(event) => setDeliveryLink(event.target.value)}
            placeholder="https://…"
            className="mt-2 h-11 w-full rounded-xl border border-black/10 px-3 text-sm font-normal outline-none focus:border-[#e77840]"
          />
        </label>
        {submitError && (
          <p className="mt-3 text-xs text-[#a65050]">{submitError}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 cursor-pointer rounded-xl border border-black/10 px-5 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!comment.trim() || submitting}
            className="h-11 cursor-pointer rounded-xl bg-[#272624] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Submitting…" : "Submit company work"}
          </button>
        </div>
      </form>
    </div>
  );
}
