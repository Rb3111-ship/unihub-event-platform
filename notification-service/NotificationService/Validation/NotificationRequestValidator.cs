using FluentValidation;
using NotificationService.Models;

namespace NotificationService.Validation;

public class NotificationRequestValidator : AbstractValidator<NotificationRequest>
{
    public NotificationRequestValidator()
    {
        RuleFor(x => x.EventId).NotEmpty();
        RuleFor(x => x.EventName).NotEmpty();
        RuleFor(x => x.Message).NotEmpty().MaximumLength(2000);

        // Rule for the entire Recipients collection
        RuleFor(x => x.Recipients)
            .NotEmpty() // Ensures the list itself is not empty
            .Must(list => list.Count <= 50)
            .WithMessage("A maximum of 50 recipients are allowed per request.");

        // Rules for each individual Recipient object within the collection
        RuleForEach(x => x.Recipients).ChildRules(recipientRules =>
        {
            recipientRules.RuleFor(r => r.Email)
                          .NotEmpty()
                          .EmailAddress();

            // Optional: Add validation for Name if needed
            // recipientRules.RuleFor(r => r.Name)
            //               .MaximumLength(100);
        });
    }
}