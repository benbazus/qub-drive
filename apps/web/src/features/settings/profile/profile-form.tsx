import { z } from 'zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'

import { showSubmittedData } from '@/utils/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters.')
    .max(30, 'Username must not be longer than 30 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  bio: z
    .string()
    .min(4, 'Bio must be at least 4 characters.')
    .max(160, 'Bio must not exceed 160 characters.'),
  urls: z
    .array(
      z.object({
        value: z.string().url('Please enter a valid URL.'),
      })
    )
    .optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

const defaultValues: Partial<ProfileFormValues> = {
  bio: 'I own a computer.',
  urls: [
    { value: 'https://shadcn.com' },
    { value: 'http://twitter.com/shadcn' },
  ],
}

export default function ProfileForm() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  })

  const { fields, append, remove } = useFieldArray({
    name: 'urls',
    control: form.control,
  })

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">
          Update your profile information and preferences.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => showSubmittedData(data))}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="shadcn" {...field} />
                </FormControl>
                <FormDescription>
                  Your public display name. Can only be changed once every 30 days.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a verified email" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="m@example.com">m@example.com</SelectItem>
                    <SelectItem value="m@google.com">m@google.com</SelectItem>
                    <SelectItem value="m@support.com">m@support.com</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Manage email addresses in your{' '}
                  <Link to="/" className="underline underline-offset-4 hover:text-primary">
                    email settings
                  </Link>
                  .
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us a little bit about yourself"
                    className="resize-none min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  You can <span className="font-medium">@mention</span> other users and organizations.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div>
              <FormLabel>URLs</FormLabel>
              <FormDescription>
                Add links to your website, blog, or social media profiles.
              </FormDescription>
            </div>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <FormField
                  control={form.control}
                  key={field.id}
                  name={`urls.${index}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} />
                        </FormControl>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ value: '' })}
              >
                Add URL
              </Button>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit">Update profile</Button>
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}